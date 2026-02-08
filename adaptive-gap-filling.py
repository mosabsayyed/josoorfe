#!/usr/bin/env python3
"""
Adaptive Gap-Filling with Forward/Backward Matching
Ensures no orphans or bastards by adaptively lowering thresholds per node
"""
import math
import csv
import logging
from datetime import datetime
from neo4j import GraphDatabase

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Staging database connection
STAGING_URI = "neo4j://localhost:7688"
STAGING_USER = "neo4j"
STAGING_PASSWORD = "stagingpassword"
STAGING_DATABASE = "neo4j"

# Initial thresholds (can be lowered adaptively)
INITIAL_THRESHOLDS = {
    # Phase 1: Sector Value Chain
    "REFERS_TO": 0.40,
    "APPLIED_ON": 0.45,
    "TRIGGERS_EVENT": 0.60,
    "MEASURED_BY": 0.50,
    "AGGREGATES_TO": 0.50,
    "REALIZED_VIA": 0.50,
    # Phase 2: Strategic Initiatives
    "SETS_PRIORITIES": 0.50,
    "ROLE_GAPS": 0.50,
    "KNOWLEDGE_GAPS": 0.50,
    "AUTOMATION_GAPS": 0.50,
    "GAPS_SCOPE": 0.50,
    "ADOPTION_RISKS": 0.50,
    # Phase 3: Strategic Priorities
    "CASCADED_VIA": 0.50,
    "SETS_TARGETS": 0.50,
    # Phase 4: Build Oversight
    "INCREASE_ADOPTION": 0.50,
    "CLOSE_GAPS": 0.50,
    "MONITORED_BY": 0.50,
    "INFORMS": 0.50,
    "GOVERNED_BY": 0.50,
    # Phase 5: Sustainable Operations
    "MONITORS_FOR": 0.50,
    "APPLY": 0.50,
    "AUTOMATION": 0.50,
    "DEPENDS_ON": 0.50,
}

# Threshold steps for adaptive lowering
THRESHOLD_STEPS = [0.50, 0.45, 0.40, 0.35, 0.30, 0.25, 0.20]
MIN_THRESHOLD = 0.20

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

def find_best_match(source, targets, source_label, target_label, threshold):
    """Find best matching target above threshold."""
    best_match = None
    best_score = -1.0

    for target in targets:
        # Skip self-matching
        if source['id'] == target['id'] and source_label == target_label:
            continue

        score = cosine_similarity(source['embedding'], target['embedding'])

        if score >= threshold and score > best_score:
            best_score = score
            best_match = target

    return best_match, best_score

def forward_pass(client, source_label, target_label, rel_type, threshold, year, source_level='L1', target_level='L1'):
    """Forward matching: each source finds best target."""
    logger.info(f"  Forward pass: {source_label}({source_level}) -> {target_label}({target_level}) (threshold: {threshold})")

    sources = fetch_nodes_with_embeddings(client, source_label, year, source_level)
    targets = fetch_nodes_with_embeddings(client, target_label, year, target_level)

    connections = []
    matched_sources = set()

    for source in sources:
        match, score = find_best_match(source, targets, source_label, target_label, threshold)
        if match:
            connections.append({
                'source_id': source['id'],
                'source_label': source_label,
                'target_id': match['id'],
                'target_label': target_label,
                'rel_type': rel_type,
                'similarity': score,
                'threshold_used': threshold,
                'pass_type': 'forward',
                'year': year
            })
            matched_sources.add(source['id'])

    orphans = [s for s in sources if s['id'] not in matched_sources]
    return connections, orphans

def backward_pass(client, source_label, target_label, rel_type, threshold, year, source_level='L1', target_level='L1'):
    """Backward matching: each target finds best source."""
    logger.info(f"  Backward pass: {target_label}({target_level}) <- {source_label}({source_level}) (threshold: {threshold})")

    sources = fetch_nodes_with_embeddings(client, source_label, year, source_level)
    targets = fetch_nodes_with_embeddings(client, target_label, year, target_level)

    connections = []
    matched_targets = set()

    for target in targets:
        # Find best source for this target
        best_source = None
        best_score = -1.0

        for source in sources:
            # Skip self-matching
            if source['id'] == target['id'] and source_label == target_label:
                continue

            score = cosine_similarity(target['embedding'], source['embedding'])

            if score >= threshold and score > best_score:
                best_score = score
                best_source = source

        if best_source:
            connections.append({
                'source_id': best_source['id'],
                'source_label': source_label,
                'target_id': target['id'],
                'target_label': target_label,
                'rel_type': rel_type,
                'similarity': best_score,
                'threshold_used': threshold,
                'pass_type': 'backward',
                'year': year
            })
            matched_targets.add(target['id'])

    bastards = [t for t in targets if t['id'] not in matched_targets]
    return connections, bastards

def adaptive_orphan_resolution(client, orphans, source_label, target_label, rel_type, year, target_level='L1'):
    """Adaptively lower threshold for orphans until they find a match."""
    logger.info(f"  Resolving {len(orphans)} orphans...")

    targets = fetch_nodes_with_embeddings(client, target_label, year, target_level)
    connections = []

    for orphan in orphans:
        matched = False

        for threshold in THRESHOLD_STEPS:
            if threshold < MIN_THRESHOLD:
                break

            match, score = find_best_match(orphan, targets, source_label, target_label, threshold)
            if match:
                connections.append({
                    'source_id': orphan['id'],
                    'source_label': source_label,
                    'target_id': match['id'],
                    'target_label': target_label,
                    'rel_type': rel_type,
                    'similarity': score,
                    'threshold_used': threshold,
                    'pass_type': 'forward_adaptive',
                    'year': year
                })
                logger.info(f"    Orphan {orphan['id']} matched at threshold {threshold} (score: {score:.3f})")
                matched = True
                break

        if not matched:
            logger.warning(f"    Orphan {orphan['id']} ({orphan['name']}) could not be matched even at {MIN_THRESHOLD}")

    return connections

def adaptive_bastard_resolution(client, bastards, source_label, target_label, rel_type, year, source_level='L1'):
    """Adaptively lower threshold for bastards until they find a match."""
    logger.info(f"  Resolving {len(bastards)} bastards...")

    sources = fetch_nodes_with_embeddings(client, source_label, year, source_level)
    connections = []

    for bastard in bastards:
        matched = False

        for threshold in THRESHOLD_STEPS:
            if threshold < MIN_THRESHOLD:
                break

            # Find best source for this bastard target
            best_source = None
            best_score = -1.0

            for source in sources:
                if source['id'] == bastard['id'] and source_label == target_label:
                    continue

                score = cosine_similarity(bastard['embedding'], source['embedding'])

                if score >= threshold and score > best_score:
                    best_score = score
                    best_source = source

            if best_source:
                connections.append({
                    'source_id': best_source['id'],
                    'source_label': source_label,
                    'target_id': bastard['id'],
                    'target_label': target_label,
                    'rel_type': rel_type,
                    'similarity': best_score,
                    'threshold_used': threshold,
                    'pass_type': 'backward_adaptive',
                    'year': year
                })
                logger.info(f"    Bastard {bastard['id']} matched at threshold {threshold} (score: {best_score:.3f})")
                matched = True
                break

        if not matched:
            logger.warning(f"    Bastard {bastard['id']} ({bastard['name']}) could not be matched even at {MIN_THRESHOLD}")

    return connections

def process_relationship(client, source_label, target_label, rel_type, year, source_level='L1', target_level='L1'):
    """Process one relationship type with forward/backward matching and adaptive resolution."""
    logger.info(f"\n{'='*80}")
    logger.info(f"Processing: {source_label}({source_level}) -[:{rel_type}]-> {target_label}({target_level}) (Year: {year})")
    logger.info(f"{'='*80}")

    threshold = INITIAL_THRESHOLDS.get(rel_type, 0.50)

    # Forward pass
    forward_connections, orphans = forward_pass(
        client, source_label, target_label, rel_type, threshold, year, source_level, target_level
    )
    logger.info(f"  Forward: {len(forward_connections)} connections, {len(orphans)} orphans")

    # Backward pass
    backward_connections, bastards = backward_pass(
        client, source_label, target_label, rel_type, threshold, year, source_level, target_level
    )
    logger.info(f"  Backward: {len(backward_connections)} connections, {len(bastards)} bastards")

    # Adaptive orphan resolution
    orphan_connections = []
    if orphans:
        orphan_connections = adaptive_orphan_resolution(
            client, orphans, source_label, target_label, rel_type, year, target_level
        )

    # Adaptive bastard resolution
    bastard_connections = []
    if bastards:
        bastard_connections = adaptive_bastard_resolution(
            client, bastards, source_label, target_label, rel_type, year, source_level
        )

    # Merge all connections (remove duplicates)
    all_connections = forward_connections + backward_connections + orphan_connections + bastard_connections

    # Deduplicate by (source_id, target_id)
    unique_connections = {}
    for conn in all_connections:
        key = (conn['source_id'], conn['target_id'])
        if key not in unique_connections or conn['similarity'] > unique_connections[key]['similarity']:
            unique_connections[key] = conn

    final_connections = list(unique_connections.values())
    logger.info(f"  Final: {len(final_connections)} unique connections")

    return final_connections

def main():
    logger.info("Starting Adaptive Gap-Filling...")

    client = Neo4jStaging()

    try:
        # Test connection
        result = client.execute_query("RETURN 1 as test")
        logger.info("✓ Connected to staging database\n")

        # Relationship pairs: (source_label, target_label, rel_type, source_level, target_level)
        # Levels based on actual data patterns in the database
        enrichment_pairs = [
            # Phase 1: Sector Value Chain (all L1)
            ("SectorObjective", "SectorPolicyTool", "REALIZED_VIA", "L1", "L1"),
            ("SectorPolicyTool", "SectorAdminRecord", "REFERS_TO", "L1", "L1"),
            ("SectorAdminRecord", "SectorBusiness", "APPLIED_ON", "L1", "L1"),
            ("SectorAdminRecord", "SectorCitizen", "APPLIED_ON", "L1", "L1"),
            ("SectorAdminRecord", "SectorGovEntity", "APPLIED_ON", "L1", "L1"),
            ("SectorBusiness", "SectorDataTransaction", "TRIGGERS_EVENT", "L1", "L1"),
            ("SectorCitizen", "SectorDataTransaction", "TRIGGERS_EVENT", "L1", "L1"),
            ("SectorGovEntity", "SectorDataTransaction", "TRIGGERS_EVENT", "L1", "L1"),
            ("SectorDataTransaction", "SectorPerformance", "MEASURED_BY", "L1", "L1"),
            ("SectorPerformance", "SectorObjective", "AGGREGATES_TO", "L1", "L1"),

            # Phase 2: Strategic Initiatives
            ("SectorPolicyTool", "EntityCapability", "SETS_PRIORITIES", "L1", "L1"),
            ("EntityCapability", "EntityOrgUnit", "ROLE_GAPS", "L3", "L3"),
            ("EntityCapability", "EntityProcess", "KNOWLEDGE_GAPS", "L3", "L3"),
            ("EntityCapability", "EntityITSystem", "AUTOMATION_GAPS", "L3", "L3"),
            ("EntityOrgUnit", "EntityProject", "GAPS_SCOPE", "L3", "L3"),
            ("EntityProcess", "EntityProject", "GAPS_SCOPE", "L3", "L3"),
            ("EntityITSystem", "EntityProject", "GAPS_SCOPE", "L3", "L3"),
            ("EntityProject", "EntityChangeAdoption", "ADOPTION_RISKS", "L3", "L3"),

            # Phase 3: Strategic Priorities
            ("SectorObjective", "SectorPerformance", "CASCADED_VIA", "L1", "L1"),
            ("SectorPerformance", "EntityCapability", "SETS_TARGETS", "L2", "L2"),
            ("SectorPerformance", "EntityCapability", "SETS_TARGETS", "L1", "L1"),
            ("SectorPerformance", "EntityCapability", "SETS_TARGETS", "L3", "L3"),

            # Phase 4: Build Oversight
            ("EntityChangeAdoption", "EntityProject", "INCREASE_ADOPTION", "L3", "L3"),
            ("EntityProject", "EntityOrgUnit", "CLOSE_GAPS", "L3", "L3"),
            ("EntityProject", "EntityProcess", "CLOSE_GAPS", "L3", "L3"),
            ("EntityProject", "EntityITSystem", "CLOSE_GAPS", "L3", "L3"),
            ("EntityCapability", "EntityRisk", "MONITORED_BY", "L3", "L3"),
            ("EntityRisk", "SectorPolicyTool", "INFORMS", "L2", "L2"),
            ("EntityRisk", "SectorPerformance", "INFORMS", "L2", "L2"),
            ("SectorPolicyTool", "SectorObjective", "GOVERNED_BY", "L1", "L1"),

            # Phase 5: Sustainable Operations (all L3)
            ("EntityCultureHealth", "EntityOrgUnit", "MONITORS_FOR", "L3", "L3"),
            ("EntityOrgUnit", "EntityProcess", "APPLY", "L3", "L3"),
            ("EntityProcess", "EntityITSystem", "AUTOMATION", "L3", "L3"),
            ("EntityITSystem", "EntityVendor", "DEPENDS_ON", "L3", "L3"),
        ]

        # Process all years
        all_connections = []
        years = [2025, 2026, 2027, 2028, 2029]

        for year in years:
            logger.info(f"\n\n{'#'*80}")
            logger.info(f"# YEAR {year}")
            logger.info(f"{'#'*80}\n")

            for source_label, target_label, rel_type, src_level, tgt_level in enrichment_pairs:
                connections = process_relationship(
                    client, source_label, target_label, rel_type, year,
                    source_level=src_level, target_level=tgt_level
                )
                all_connections.extend(connections)

        # Save to CSV
        output_file = f"adaptive-gap-filling-all-chains-{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        with open(output_file, 'w', newline='') as f:
            if all_connections:
                writer = csv.DictWriter(f, fieldnames=all_connections[0].keys())
                writer.writeheader()
                writer.writerows(all_connections)

        logger.info(f"\n{'='*80}")
        logger.info(f"Results saved to: {output_file}")
        logger.info(f"Total connections: {len(all_connections)}")
        logger.info(f"{'='*80}")

        # Summary statistics
        by_pass_type = {}
        for conn in all_connections:
            pt = conn['pass_type']
            by_pass_type[pt] = by_pass_type.get(pt, 0) + 1

        logger.info("\nConnections by pass type:")
        for pt, count in sorted(by_pass_type.items()):
            logger.info(f"  {pt}: {count}")

        # Summary by relationship type
        by_rel = {}
        for conn in all_connections:
            rt = conn['rel_type']
            by_rel[rt] = by_rel.get(rt, 0) + 1

        logger.info("\nConnections by relationship type:")
        for rt, count in sorted(by_rel.items()):
            logger.info(f"  {rt}: {count}")

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
