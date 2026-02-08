#!/usr/bin/env python3
"""
Analyze similarity score distribution to determine appropriate thresholds
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

def analyze_pair(client, source_label, target_label, relationship_type):
    """Analyze similarity scores for a source-target pair."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Analyzing {source_label} -> {target_label} (:{relationship_type})")
    logger.info(f"{'='*60}")

    # Fetch sources with embeddings for year 2025
    query = f"""
    MATCH (n:{source_label})
    WHERE n.embedding IS NOT NULL AND n.year = 2025
    RETURN n.id as id, n.name as name, n.year as year, n.embedding as embedding
    """
    sources = client.execute_query(query)
    logger.info(f"Sources with embeddings (2025): {len(sources)}")

    # Fetch targets with embeddings for year 2025
    query = f"""
    MATCH (n:{target_label})
    WHERE n.embedding IS NOT NULL AND n.year = 2025
    RETURN n.id as id, n.name as name, n.year as year, n.embedding as embedding
    """
    targets = client.execute_query(query)
    logger.info(f"Targets with embeddings (2025): {len(targets)}")

    if not sources or not targets:
        logger.warning("Insufficient data for analysis")
        return

    # Calculate all similarity scores
    all_scores = []
    for source in sources:
        best_score = -1.0
        for target in targets:
            if source['id'] == target['id'] and source_label == target_label:
                continue
            score = cosine_similarity(source['embedding'], target['embedding'])
            if score > best_score:
                best_score = score
        all_scores.append(best_score)

    # Statistics
    all_scores.sort(reverse=True)
    avg_score = sum(all_scores) / len(all_scores)
    median_score = all_scores[len(all_scores) // 2]
    p75_score = all_scores[int(len(all_scores) * 0.25)]
    p90_score = all_scores[int(len(all_scores) * 0.10)]

    logger.info(f"\nSimilarity Score Distribution:")
    logger.info(f"  Max:     {max(all_scores):.4f}")
    logger.info(f"  P90:     {p90_score:.4f}")
    logger.info(f"  P75:     {p75_score:.4f}")
    logger.info(f"  Median:  {median_score:.4f}")
    logger.info(f"  Average: {avg_score:.4f}")
    logger.info(f"  Min:     {min(all_scores):.4f}")

    # Count how many would match at different thresholds
    for threshold in [0.85, 0.75, 0.60, 0.50, 0.40, 0.35]:
        count = sum(1 for s in all_scores if s >= threshold)
        pct = (count / len(all_scores)) * 100
        logger.info(f"  Threshold {threshold}: {count}/{len(all_scores)} ({pct:.1f}%) matches")

def main():
    logger.info("Analyzing similarity score distributions...")

    client = Neo4jStaging()

    try:
        # Analyze Phase 1 relationships
        pairs = [
            ("SectorPolicyTool", "SectorAdminRecord", "REFERS_TO"),
            ("SectorAdminRecord", "SectorBusiness", "APPLIED_ON"),
            ("SectorBusiness", "SectorDataTransaction", "TRIGGERS_EVENT"),
        ]

        for src, tgt, rel in pairs:
            analyze_pair(client, src, tgt, rel)

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
