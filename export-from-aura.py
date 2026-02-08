#!/usr/bin/env python3
"""
Export data from Neo4j Aura and import to local staging
"""
import sys
from neo4j import GraphDatabase

# Aura (source)
AURA_URI = "neo4j+s://097a9e5c.databases.neo4j.io"
AURA_USER = "neo4j"
AURA_PASSWORD = "kHRlxPU_u-sRldkXtqM9YRCmue1Yu841zKYvwYI0H6s"

# Local staging (destination)
LOCAL_URI = "neo4j://localhost:7688"
LOCAL_USER = "neo4j"
LOCAL_PASSWORD = "stagingpassword"

def export_and_import():
    print("🔗 Connecting to Aura...")
    aura_driver = GraphDatabase.driver(AURA_URI, auth=(AURA_USER, AURA_PASSWORD))

    print("🔗 Connecting to local staging...")
    local_driver = GraphDatabase.driver(LOCAL_URI, auth=(LOCAL_USER, LOCAL_PASSWORD))

    try:
        # Get all nodes with their labels and properties
        print("\n📊 Exporting nodes from Aura...")
        with aura_driver.session() as session:
            result = session.run("MATCH (n) RETURN count(n) as count")
            node_count = result.single()["count"]
            print(f"   Total nodes in Aura: {node_count:,}")

            if node_count > 10000:
                print("⚠️  Large database detected. This may take a while...")

            # Export nodes in batches
            batch_size = 1000
            print(f"\n📦 Exporting nodes in batches of {batch_size}...")

            for skip in range(0, node_count, batch_size):
                result = session.run("""
                    MATCH (n)
                    RETURN n
                    SKIP $skip
                    LIMIT $limit
                """, skip=skip, limit=batch_size)

                nodes = [record["n"] for record in result]

                # Import to local
                with local_driver.session() as local_session:
                    for node in nodes:
                        labels = ":".join(node.labels) if node.labels else "UnlabeledNode"
                        props = dict(node)

                        # Create node
                        local_session.run(f"""
                            CREATE (n:{labels})
                            SET n = $props
                        """, props=props)

                print(f"   Imported {skip + len(nodes):,} / {node_count:,} nodes")

        # Get all relationships
        print("\n🔗 Exporting relationships from Aura...")
        with aura_driver.session() as session:
            result = session.run("MATCH ()-[r]->() RETURN count(r) as count")
            rel_count = result.single()["count"]
            print(f"   Total relationships in Aura: {rel_count:,}")

            # Export relationships in batches
            print(f"\n📦 Exporting relationships in batches of {batch_size}...")

            for skip in range(0, rel_count, batch_size):
                result = session.run("""
                    MATCH (a)-[r]->(b)
                    RETURN a, r, b, type(r) as rel_type
                    SKIP $skip
                    LIMIT $limit
                """, skip=skip, limit=batch_size)

                rels = [(record["a"], record["r"], record["b"], record["rel_type"]) for record in result]

                # Import to local
                with local_driver.session() as local_session:
                    for source, rel, target, rel_type in rels:
                        source_labels = ":".join(source.labels) if source.labels else "UnlabeledNode"
                        target_labels = ":".join(target.labels) if target.labels else "UnlabeledNode"
                        source_props = dict(source)
                        target_props = dict(target)
                        rel_props = dict(rel)

                        # Match by id+year composite key
                        source_id = source_props.get('id')
                        source_year = source_props.get('year')
                        target_id = target_props.get('id')
                        target_year = target_props.get('year')

                        # Match and create relationship using composite key
                        if source_id is not None and target_id is not None:
                            local_session.run(f"""
                                MATCH (a:{source_labels} {{id: $source_id, year: $source_year}})
                                MATCH (b:{target_labels} {{id: $target_id, year: $target_year}})
                                MERGE (a)-[r:{rel_type}]->(b)
                                SET r = $rel_props
                            """, source_id=source_id, source_year=source_year,
                                target_id=target_id, target_year=target_year,
                                rel_props=rel_props)

                print(f"   Imported {skip + len(rels):,} / {rel_count:,} relationships")

        print("\n✅ Export and import complete!")
        print(f"\n📊 Summary:")
        print(f"   Nodes: {node_count:,}")
        print(f"   Relationships: {rel_count:,}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    finally:
        aura_driver.close()
        local_driver.close()

if __name__ == "__main__":
    export_and_import()
