#!/usr/bin/env python3
"""
Generate embeddings for PolicyTools that don't have them.
Uses OpenAI text-embedding-3-small (1536 dimensions) to match existing embeddings.
"""
import os
import logging
from datetime import datetime
from neo4j import GraphDatabase
from openai import OpenAI

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Neo4j Staging
STAGING_URI = "neo4j://localhost:7688"
STAGING_USER = "neo4j"
STAGING_PASSWORD = "stagingpassword"
STAGING_DATABASE = "neo4j"

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable not set")

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

class Neo4jStaging:
    def __init__(self):
        self.driver = GraphDatabase.driver(STAGING_URI, auth=(STAGING_USER, STAGING_PASSWORD))

    def close(self):
        self.driver.close()

    def execute_query(self, query, params=None):
        with self.driver.session(database=STAGING_DATABASE) as session:
            result = session.run(query, params or {})
            return [dict(record) for record in result]

    def execute_write_query(self, query, params=None):
        with self.driver.session(database=STAGING_DATABASE) as session:
            result = session.run(query, params or {})
            summary = result.consume()
            return summary

def create_embedding_text(node):
    """
    Combine all text fields into one string for embedding.
    Matches the format used when original embeddings were created.
    """
    parts = []

    # Primary fields
    if node.get('name'):
        parts.append(f"Name: {node['name']}")

    if node.get('tool_type'):
        parts.append(f"Type: {node['tool_type']}")

    if node.get('impact_target'):
        parts.append(f"Impact: {node['impact_target']}")

    if node.get('delivery_channel'):
        parts.append(f"Delivery: {node['delivery_channel']}")

    # Additional fields if they exist
    if node.get('cost_of_implementation'):
        parts.append(f"Cost: {node['cost_of_implementation']}")

    if node.get('status'):
        parts.append(f"Status: {node['status']}")

    return ". ".join(parts)

def generate_embedding(text, client):
    """Generate embedding using OpenAI API."""
    try:
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            dimensions=EMBEDDING_DIMENSIONS
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return None

def update_node_embedding(db_client, node_id, year, embedding):
    """Update node with generated embedding."""
    query = """
    MATCH (n:SectorPolicyTool {id: $id, year: $year})
    SET n.embedding = $embedding,
        n.embedding_generated_at = datetime()
    RETURN count(n) as updated
    """
    params = {
        "id": node_id,
        "year": year,
        "embedding": embedding
    }
    try:
        db_client.execute_write_query(query, params)
        return True
    except Exception as e:
        logger.error(f"Failed to update node {node_id}/{year}: {e}")
        return False

def main():
    logger.info("Starting embedding generation for PolicyTools without embeddings...")

    # Initialize clients
    db_client = Neo4jStaging()
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

    try:
        # Fetch PolicyTools without embeddings
        query = """
        MATCH (pt:SectorPolicyTool)
        WHERE pt.embedding IS NULL
        RETURN pt.id as id, pt.year as year, pt.name as name,
               pt.tool_type as tool_type, pt.impact_target as impact_target,
               pt.delivery_channel as delivery_channel,
               pt.cost_of_implementation as cost_of_implementation,
               pt.status as status
        ORDER BY pt.year, pt.id
        """
        nodes = db_client.execute_query(query)

        if not nodes:
            logger.info("No PolicyTools without embeddings found!")
            return 0

        logger.info(f"Found {len(nodes)} PolicyTools without embeddings")
        logger.info(f"Using model: {EMBEDDING_MODEL} ({EMBEDDING_DIMENSIONS} dimensions)")

        # Process nodes in batches
        batch_size = 10
        total_updated = 0
        failed = 0

        for i in range(0, len(nodes), batch_size):
            batch = nodes[i:i+batch_size]
            logger.info(f"\nProcessing batch {i//batch_size + 1} ({len(batch)} nodes)...")

            for node in batch:
                # Create text for embedding
                text = create_embedding_text(node)
                logger.info(f"  Node {node['id']}/{node['year']}: {node['name']}")
                logger.debug(f"    Text: {text[:100]}...")

                # Generate embedding
                embedding = generate_embedding(text, openai_client)
                if not embedding:
                    logger.warning(f"    Failed to generate embedding")
                    failed += 1
                    continue

                # Verify embedding dimensions
                if len(embedding) != EMBEDDING_DIMENSIONS:
                    logger.error(f"    Wrong embedding size: {len(embedding)} != {EMBEDDING_DIMENSIONS}")
                    failed += 1
                    continue

                # Update node
                if update_node_embedding(db_client, node['id'], node['year'], embedding):
                    total_updated += 1
                    logger.info(f"    ✓ Updated")
                else:
                    failed += 1

        logger.info(f"\n{'='*60}")
        logger.info(f"Embedding generation complete!")
        logger.info(f"  Total processed: {len(nodes)}")
        logger.info(f"  Successfully updated: {total_updated}")
        logger.info(f"  Failed: {failed}")
        logger.info(f"{'='*60}")

        return 0

    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db_client.close()

if __name__ == "__main__":
    exit(main())
