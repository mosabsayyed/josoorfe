#!/usr/bin/env python3
"""
Gap-Filling Script for Staging Database
Phase 1: Value Chain (SectorOps layer)
"""
import math
import logging
from neo4j import GraphDatabase

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Staging database connection
STAGING_URI = "neo4j://localhost:7688"
STAGING_USER = "neo4j"
STAGING_PASSWORD = "stagingpassword"
STAGING_DATABASE = "neo4j"

# Constants
SIMILARITY_THRESHOLD = 0.85  # Default High Quality
# Custom thresholds based on similarity score analysis
# Lowered thresholds to match actual embedding similarity ranges
REL_THRESHOLDS = {
    # Phase 1
    "REFERS_TO": 0.40,        # Max observed: 0.57, using 0.40 gets 100% matches
    "APPLIED_ON": 0.45,       # Max observed: 0.62, using 0.45 gets ~75% matches
    "TRIGGERS_EVENT": 0.60,   # Max observed: 0.70, using 0.60 gets 100% matches
    "MEASURED_BY": 0.50,      # Estimated based on typical ranges
    "AGGREGATES_TO": 0.50,    # Estimated based on typical ranges
    # Phase 2
    "CASCADED_VIA": 0.50,
    "SETS_TARGETS": 0.50,
    "REALIZED_VIA": 0.50,
    "SETS_PRIORITIES": 0.50
}

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

def fetch_nodes_with_embeddings(client, label, year=None, level=None):
    """Fetch all nodes of a specific label with their embeddings."""
    where_clauses = ["n.embedding IS NOT NULL"]
    params = {}

    if year:
        where_clauses.append("n.year = $year")
        params['year'] = year

    if level:
        where_clauses.append("n.level = $level")
        params['level'] = level

    where_clause = " AND ".join(where_clauses)

    query = f"""
    MATCH (n:{label})
    WHERE {where_clause}
    RETURN n.id as id, n.name as name, n.year as year, n.level as level, n.embedding as embedding
    """
    return client.execute_query(query, params)

def create_relationship(client, source_id, source_label, target_id, target_label, rel_type, year):
    """Create a relationship between two nodes."""
    query = f"""
    MATCH (s:{source_label} {{id: $source_id, year: $year}})
    MATCH (t:{target_label} {{id: $target_id, year: $year}})
    MERGE (s)-[r:{rel_type}]->(t)
    RETURN count(r) as created
    """
    params = {
        "source_id": source_id,
        "target_id": target_id,
        "year": year
    }
    try:
        client.execute_write_query(query, params)
        logger.info(f"Created :{rel_type} between {source_label}({source_id}) -> {target_label}({target_id})")
        return True
    except Exception as e:
        logger.error(f"Failed to create relationship: {e}")
        return False

def enrich_relationships(client, source_label, target_label, relationship_type, threshold=SIMILARITY_THRESHOLD):
    """Find best semantic match and create relationship if score > threshold."""
    logger.info(f"--- Enriching {source_label} -> {target_label} via :{relationship_type} (Threshold: {threshold}) ---")

    # Fetch Source Nodes
    sources = fetch_nodes_with_embeddings(client, source_label)
    if not sources:
        logger.warning(f"No source nodes found for {source_label}")
        return

    # Group sources by year AND level
    sources_by_year_level = {}
    for s in sources:
        key = (s['year'], s.get('level', 'NONE'))
        if key not in sources_by_year_level:
            sources_by_year_level[key] = []
        sources_by_year_level[key].append(s)

    total_created = 0

    # Process per year and level
    for (year, level), year_level_sources in sources_by_year_level.items():
        logger.info(f"Processing Year {year}, Level {level} ({len(year_level_sources)} sources)...")

        # Fetch targets for this year and level
        targets = fetch_nodes_with_embeddings(client, target_label, year, level if level != 'NONE' else None)
        if not targets:
            logger.warning(f"No target nodes found for {target_label} in {year}, level {level}")
            continue

        for source in year_level_sources:
            best_match = None
            best_score = -1.0

            # Find best match within same level
            for target in targets:
                if source['id'] == target['id'] and source_label == target_label:
                    continue

                score = cosine_similarity(source['embedding'], target['embedding'])

                if score > best_score:
                    best_score = score
                    best_match = target

            # Create relationship if threshold met
            if best_match and best_score >= threshold:
                created = create_relationship(
                    client,
                    source['id'], source_label,
                    best_match['id'], target_label,
                    relationship_type, year
                )
                if created:
                    total_created += 1
            else:
                logger.debug(f"No match above threshold for {source['name']} (best: {best_score:.3f})")

    logger.info(f"Created {total_created} links for {source_label} -> {target_label}")

def main():
    logger.info("Starting Semantic Graph Enrichment on Staging...")

    client = Neo4jStaging()

    try:
        # Test connection
        result = client.execute_query("RETURN 1 as test")
        logger.info(f"✓ Connected to staging database")

        # Phase 1 + Phase 2: Value Chain + Strategic Layer
        enrichment_pairs = [
            # Phase 1: Value Chain (SectorOps layer)
            ("SectorPolicyTool", "SectorAdminRecord", "REFERS_TO"),
            ("SectorAdminRecord", "SectorBusiness", "APPLIED_ON"),
            ("SectorAdminRecord", "SectorCitizen", "APPLIED_ON"),
            ("SectorAdminRecord", "SectorGovEntity", "APPLIED_ON"),
            ("SectorBusiness", "SectorDataTransaction", "TRIGGERS_EVENT"),
            ("SectorCitizen", "SectorDataTransaction", "TRIGGERS_EVENT"),
            ("SectorGovEntity", "SectorDataTransaction", "TRIGGERS_EVENT"),
            ("SectorDataTransaction", "SectorPerformance", "MEASURED_BY"),
            ("SectorPerformance", "SectorObjective", "AGGREGATES_TO"),
            # Phase 2: Strategic Planning Layer
            ("SectorObjective", "SectorPerformance", "CASCADED_VIA"),
            ("SectorPerformance", "EntityCapability", "SETS_TARGETS"),
            ("SectorObjective", "SectorPolicyTool", "REALIZED_VIA"),
            ("SectorPolicyTool", "EntityCapability", "SETS_PRIORITIES"),
        ]

        logger.info(f"\n{'='*60}")
        logger.info(f"PHASE 1+2: Value Chain + Strategic Layer (9 relationship types)")
        logger.info(f"{'='*60}\n")

        for src, tgt, rel in enrichment_pairs:
            threshold = REL_THRESHOLDS.get(rel, SIMILARITY_THRESHOLD)
            enrich_relationships(client, src, tgt, rel, threshold)
            logger.info("")  # Blank line for readability

        logger.info("\n✓ Semantic Enrichment Complete.")

    except Exception as e:
        logger.error(f"Error: {e}")
        return 1
    finally:
        client.close()

    return 0

if __name__ == "__main__":
    exit(main())
