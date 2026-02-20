#!/usr/bin/env python3
"""
Apply gap-filling connections from CSV to database
"""
import csv
import logging
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

STAGING_URI = "neo4j://localhost:7688"
STAGING_USER = "neo4j"
STAGING_PASSWORD = "stagingpassword"
STAGING_DATABASE = "neo4j"

class Neo4jStaging:
    def __init__(self):
        self.driver = GraphDatabase.driver(STAGING_URI, auth=(STAGING_USER, STAGING_PASSWORD))

    def close(self):
        self.driver.close()

    def execute_write_query(self, query, params=None):
        with self.driver.session(database=STAGING_DATABASE) as session:
            result = session.run(query, params or {})
            summary = result.consume()
            return summary

def create_relationship(client, connection):
    """Create a relationship from connection data.
    Uses persistence-aware matching: finds the latest version of each node
    at or before the target year (capability persistence rule).
    """
    query = f"""
    MATCH (s:{connection['source_label']} {{id: $source_id}})
    WHERE s.year <= $year
    WITH s ORDER BY s.year DESC LIMIT 1
    MATCH (t:{connection['target_label']} {{id: $target_id}})
    WHERE t.year <= $year
    WITH s, t ORDER BY t.year DESC LIMIT 1
    MERGE (s)-[r:{connection['rel_type']}]->(t)
    SET r.similarity = $similarity,
        r.threshold_used = $threshold_used,
        r.pass_type = $pass_type,
        r.effective_year = $year,
        r.gap_filled = true,
        r.gap_filled_at = datetime()
    RETURN count(r) as created
    """
    params = {
        "source_id": connection['source_id'],
        "target_id": connection['target_id'],
        "year": int(connection['year']),
        "similarity": float(connection['similarity']),
        "threshold_used": float(connection['threshold_used']),
        "pass_type": connection['pass_type']
    }
    try:
        client.execute_write_query(query, params)
        return True
    except Exception as e:
        logger.error(f"Failed to create {connection['source_id']}->{connection['target_id']}: {e}")
        return False

def main():
    import sys

    if len(sys.argv) < 2:
        logger.error("Usage: python apply-gap-filling.py <csv-file>")
        return 1

    csv_file = sys.argv[1]
    logger.info(f"Applying connections from: {csv_file}")

    client = Neo4jStaging()

    try:
        # Read CSV
        connections = []
        with open(csv_file, 'r') as f:
            reader = csv.DictReader(f)
            connections = list(reader)

        logger.info(f"Found {len(connections)} connections to apply")

        # Group by pass type for progress reporting
        by_pass_type = {}
        for conn in connections:
            pt = conn['pass_type']
            by_pass_type[pt] = by_pass_type.get(pt, 0) + 1

        logger.info("Breakdown:")
        for pt, count in sorted(by_pass_type.items()):
            logger.info(f"  {pt}: {count}")

        # Apply connections
        created = 0
        failed = 0

        for i, conn in enumerate(connections, 1):
            if i % 500 == 0:
                logger.info(f"Progress: {i}/{len(connections)} ({100*i//len(connections)}%)")

            if create_relationship(client, conn):
                created += 1
            else:
                failed += 1

        logger.info(f"\n{'='*80}")
        logger.info(f"Application complete:")
        logger.info(f"  Created: {created}")
        logger.info(f"  Failed: {failed}")
        logger.info(f"{'='*80}")

        return 0

    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    exit(main())
