#!/usr/bin/env python3
"""
Test gap-filling logic to debug why relationships aren't being created
"""
import math
import logging
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

STAGING_URI = "neo4j://localhost:7688"
STAGING_USER = "neo4j"
STAGING_PASSWORD = "stagingpassword"
STAGING_DATABASE = "neo4j"

def cosine_similarity(v1, v2):
    """Compute cosine similarity between two vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(b * b for b in v2))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)

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

def main():
    logger.info("Testing gap-filling logic...")

    client = Neo4jStaging()

    try:
        # Fetch one PolicyTool with embedding for year 2025
        query = """
        MATCH (pt:SectorPolicyTool)
        WHERE pt.embedding IS NOT NULL AND pt.year = 2025
        RETURN pt.id as id, pt.name as name, pt.year as year, pt.embedding as embedding
        LIMIT 1
        """
        sources = client.execute_query(query)

        if not sources:
            logger.error("No PolicyTools with embeddings found")
            return 1

        source = sources[0]
        logger.info(f"Source: {source['name']} (id={source['id']}, year={source['year']})")
        logger.info(f"Embedding length: {len(source['embedding'])}")

        # Fetch all AdminRecords with embeddings for year 2025
        query = """
        MATCH (ar:SectorAdminRecord)
        WHERE ar.embedding IS NOT NULL AND ar.year = 2025
        RETURN ar.id as id, ar.name as name, ar.year as year, ar.embedding as embedding
        """
        targets = client.execute_query(query)
        logger.info(f"Found {len(targets)} AdminRecords with embeddings for year 2025")

        if not targets:
            logger.error("No AdminRecords with embeddings found")
            return 1

        # Find best match
        best_match = None
        best_score = -1.0

        for target in targets:
            score = cosine_similarity(source['embedding'], target['embedding'])
            if score > best_score:
                best_score = score
                best_match = target

        logger.info(f"Best match: {best_match['name']} (id={best_match['id']}) with score {best_score:.4f}")

        # Now try to create the relationship
        logger.info(f"\nAttempting to create relationship...")
        query = """
        MATCH (s:SectorPolicyTool {id: $source_id, year: $year})
        MATCH (t:SectorAdminRecord {id: $target_id, year: $year})
        MERGE (s)-[r:REFERS_TO]->(t)
        RETURN count(r) as created
        """
        params = {
            "source_id": source['id'],
            "target_id": best_match['id'],
            "year": source['year']
        }

        logger.info(f"Query params: {params}")
        result = client.execute_query(query, params)
        logger.info(f"Result: {result}")

        # Verify it exists
        verify_query = """
        MATCH (s:SectorPolicyTool {id: $source_id, year: $year})-[r:REFERS_TO]->(t:SectorAdminRecord {id: $target_id, year: $year})
        RETURN s.name as source_name, t.name as target_name
        """
        verification = client.execute_query(verify_query, params)
        logger.info(f"Verification: {verification}")

    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

    return 0

if __name__ == "__main__":
    exit(main())
