#!/usr/bin/env python3
"""
Run ALL 7 chain narrative + diagnostic queries against Aura.
Exact same queries as ChainTestDesk.tsx — just via bolt instead of HTTP.
"""
import sys
from neo4j import GraphDatabase

AURA_URI = "neo4j+s://097a9e5c.databases.neo4j.io"
AURA_USER = "neo4j"
AURA_PASSWORD = "kHRlxPU_u-sRldkXtqM9YRCmue1Yu841zKYvwYI0H6s"

# Year filter (set to '0' for all years, or e.g. '2025')
YEAR = '0'

YF = f"($year = '0' OR toInteger(root.year) = toInteger($year))"
YFN = f"($year = '0' OR toInteger(n.year) = toInteger($year))"

# Return clause for narrative queries
RET = """id(n) AS id, labels(n)[0] AS label, coalesce(n.name, n.id) AS name,
n.level AS level, n.year AS year,
id(startNode(r)) AS source, id(endNode(r)) AS target, type(r) AS relType"""

# Return clause for diagnostic queries  
DRET = """id(n) AS id, labels(n)[0] AS label, coalesce(n.name, n.id) AS name,
n.level AS level, n.year AS year,
id(startNode(r)) AS source, id(endNode(r)) AS target, type(r) AS relType"""

CHAINS = {
    "sector_value_chain": {
        "name": "Sector Value Chain",
        "narrative": f"""MATCH path = (root:SectorObjective {{level:'L1'}})-[:REALIZED_VIA]->(pol:SectorPolicyTool {{level:'L1'}})-[:REFERS_TO]->(rec:SectorAdminRecord {{level:'L1'}})-[:APPLIED_ON]->(stake {{level:'L1'}})-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction {{level:'L1'}})-[:MEASURED_BY]->(perf:SectorPerformance {{level:'L1'}})-[:AGGREGATES_TO]->(root)
WHERE (stake:SectorBusiness OR stake:SectorCitizen OR stake:SectorGovEntity) AND {YF}
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    },
    "setting_strategic_initiatives": {
        "name": "Strategic Initiatives",
        "narrative": f"""MATCH path = (root:SectorObjective {{level:'L1'}})-[:REALIZED_VIA]->(polL1:SectorPolicyTool {{level:'L1'}})-[:PARENT_OF*0..1]->(polL2:SectorPolicyTool {{level:'L2'}})-[:SETS_PRIORITIES]->(capL2:EntityCapability {{level:'L2'}})-[:PARENT_OF*0..1]->(capL3:EntityCapability {{level:'L3'}})-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {{level:'L3'}})-[:GAPS_SCOPE]->(proj:EntityProject {{level:'L3'}})-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption {{level:'L3'}})
WHERE {YF}
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    },
    "setting_strategic_priorities": {
        "name": "Strategic Priorities",
        "narrative": f"""MATCH path = (root:SectorObjective {{level:'L1'}})-[:CASCADED_VIA]->(perfL1:SectorPerformance {{level:'L1'}})-[:PARENT_OF*0..1]->(perfL2:SectorPerformance {{level:'L2'}})-[:SETS_TARGETS]->(capL2:EntityCapability {{level:'L2'}})-[:PARENT_OF*0..1]->(capL3:EntityCapability {{level:'L3'}})-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {{level:'L3'}})
WHERE {YF}
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    },
    "build_oversight": {
        "name": "Build Oversight",
        "narrative": f"""MATCH (root:EntityChangeAdoption {{level:'L3'}}) WHERE {YF}
MATCH path = (root)-[:INCREASE_ADOPTION]->(proj:EntityProject {{level:'L3'}})-[:CLOSE_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {{level:'L3'}})-[:GAP_STATUS]->(capL3:EntityCapability {{level:'L3'}})-[:MONITORED_BY]->(riskL3:EntityRisk {{level:'L3'}})<-[:PARENT_OF]-(riskL2:EntityRisk {{level:'L2'}})-[:INFORMS]->(polL2:SectorPolicyTool {{level:'L2'}})<-[:PARENT_OF*0..1]-(polL1:SectorPolicyTool {{level:'L1'}})-[:GOVERNED_BY]->(objL1:SectorObjective {{level:'L1'}})
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    },
    "operate_oversight": {
        "name": "Operate Oversight",
        "narrative": f"""MATCH (root:EntityCapability {{level:'L3'}}) WHERE {YF}
MATCH path = (root)-[:MONITORED_BY]->(riskL3:EntityRisk {{level:'L3'}})<-[:PARENT_OF]-(riskL2:EntityRisk {{level:'L2'}})-[:INFORMS]->(perfL2:SectorPerformance {{level:'L2'}})<-[:PARENT_OF]-(perfL1:SectorPerformance {{level:'L1'}})-[:AGGREGATES_TO]->(objL1:SectorObjective {{level:'L1'}})
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    },
    "sustainable_operations": {
        "name": "Sustainable Operations",
        "narrative": f"""MATCH (root:EntityCultureHealth {{level:'L3'}}) WHERE {YF}
MATCH path = (root)-[:MONITORS_FOR]->(org:EntityOrgUnit {{level:'L3'}})-[:APPLY]->(proc:EntityProcess {{level:'L3'}})-[:AUTOMATION]->(sys:EntityITSystem {{level:'L3'}})-[:DEPENDS_ON]->(vendor:EntityVendor {{level:'L3'}})
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    },
    "integrated_oversight": {
        "name": "Integrated Oversight",
        "narrative": f"""MATCH (root:SectorPolicyTool {{level:'L2'}}) WHERE {YF}
MATCH p1 = (root)-[:SETS_PRIORITIES]->(capL2:EntityCapability {{level:'L2'}})
MATCH p2 = (capL2)-[:PARENT_OF*0..1]->(capL3:EntityCapability {{level:'L3'}})
MATCH p3 = (capL3)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem {{level:'L3'}})
MATCH p4 = (capL3)<-[:MONITORED_BY]-(riskL3:EntityRisk {{level:'L3'}})
MATCH p5 = (riskL3)<-[:PARENT_OF*0..1]-(riskL2:EntityRisk {{level:'L2'}})
MATCH p6 = (riskL2)-[:INFORMS]->(perfL2:SectorPerformance {{level:'L2'}})
WITH [p1,p2,p3,p4,p5,p6] AS paths UNWIND paths AS path
UNWIND nodes(path) AS n UNWIND relationships(path) AS r WITH DISTINCT n, r RETURN DISTINCT {RET}"""
    }
}


def run_chain(session, chain_key, chain_def, year):
    """Run a single chain's narrative query and return results."""
    query = chain_def["narrative"]
    try:
        result = session.run(query, year=year)
        records = list(result)
        
        # Count unique nodes and relationships
        node_ids = set()
        rel_pairs = set()
        labels = {}
        rel_types = {}
        
        for rec in records:
            nid = rec["id"]
            label = rec["label"]
            node_ids.add(nid)
            labels[label] = labels.get(label, 0) + 1
            
            if rec["source"] is not None and rec["target"] is not None:
                rtype = rec["relType"]
                pair = (rec["source"], rec["target"], rtype)
                rel_pairs.add(pair)
                rel_types[rtype] = rel_types.get(rtype, 0) + 1
        
        return {
            "nodes": len(node_ids),
            "rels": len(rel_pairs),
            "labels": labels,
            "rel_types": rel_types,
            "error": None
        }
    except Exception as e:
        return {"nodes": 0, "rels": 0, "labels": {}, "rel_types": {}, "error": str(e)}


def main():
    year = YEAR
    if len(sys.argv) > 1:
        year = sys.argv[1]
    
    print("=" * 70)
    print(f"  CHAIN TEST — AURA DATABASE  (year filter: {'ALL' if year == '0' else year})")
    print("=" * 70)
    
    driver = GraphDatabase.driver(AURA_URI, auth=(AURA_USER, AURA_PASSWORD))
    
    try:
        with driver.session() as session:
            # Quick DB stats
            r = session.run("MATCH (n) RETURN count(n) as nodes")
            nodes = r.single()["nodes"]
            r = session.run("MATCH ()-[r]->() RETURN count(r) as rels")
            rels = r.single()["rels"]
            print(f"\n  DB: {nodes:,} nodes, {rels:,} relationships\n")
            
            all_pass = True
            for key, cdef in CHAINS.items():
                result = run_chain(session, key, cdef, year)
                
                if result["error"]:
                    status = "ERROR"
                    all_pass = False
                elif result["nodes"] == 0:
                    status = "EMPTY"
                    all_pass = False
                else:
                    status = "OK"
                
                # Status line
                symbol = {"OK": "✅", "EMPTY": "❌", "ERROR": "⚠️"}[status]
                print(f"{symbol} {cdef['name']:30s} | {result['nodes']:4d} nodes | {result['rels']:4d} rels | {status}")
                
                if result["error"]:
                    print(f"   ERROR: {result['error'][:120]}")
                elif result["nodes"] > 0:
                    # Show label breakdown
                    label_str = ", ".join(f"{l}:{c}" for l, c in sorted(result["labels"].items()))
                    print(f"   Labels: {label_str}")
                    rel_str = ", ".join(f"{r}:{c}" for r, c in sorted(result["rel_types"].items()))
                    print(f"   Rels:   {rel_str}")
                else:
                    # For EMPTY chains, probe why
                    print(f"   → Chain returned 0 results. Probing key links...")
                    probe_chain(session, key, year)
                
                print()
            
            print("=" * 70)
            if all_pass:
                print("  ALL 7 CHAINS PASS ✅")
            else:
                print("  SOME CHAINS FAILED — see above for details")
            print("=" * 70)
    
    finally:
        driver.close()


def probe_chain(session, chain_key, year):
    """For empty chains, probe individual relationship links to find the break."""
    probes = {
        "sector_value_chain": [
            ("SectorObjective L1 → REALIZED_VIA → SectorPolicyTool L1",
             "MATCH (a:SectorObjective {level:'L1'})-[:REALIZED_VIA]->(b:SectorPolicyTool {level:'L1'}) RETURN count(*) as c"),
            ("SectorPolicyTool L1 → REFERS_TO → SectorAdminRecord L1",
             "MATCH (a:SectorPolicyTool {level:'L1'})-[:REFERS_TO]->(b:SectorAdminRecord {level:'L1'}) RETURN count(*) as c"),
            ("SectorAdminRecord L1 → APPLIED_ON → Stakeholder L1",
             "MATCH (a:SectorAdminRecord {level:'L1'})-[:APPLIED_ON]->(b {level:'L1'}) WHERE b:SectorBusiness OR b:SectorCitizen OR b:SectorGovEntity RETURN count(*) as c"),
            ("Stakeholder L1 → TRIGGERS_EVENT → SectorDataTx L1",
             "MATCH (a {level:'L1'})-[:TRIGGERS_EVENT]->(b:SectorDataTransaction {level:'L1'}) WHERE a:SectorBusiness OR a:SectorCitizen OR a:SectorGovEntity RETURN count(*) as c"),
            ("SectorDataTx L1 → MEASURED_BY → SectorPerformance L1",
             "MATCH (a:SectorDataTransaction {level:'L1'})-[:MEASURED_BY]->(b:SectorPerformance {level:'L1'}) RETURN count(*) as c"),
            ("SectorPerformance L1 → AGGREGATES_TO → SectorObjective L1",
             "MATCH (a:SectorPerformance {level:'L1'})-[:AGGREGATES_TO]->(b:SectorObjective {level:'L1'}) RETURN count(*) as c"),
        ],
        "setting_strategic_initiatives": [
            ("SectorObjective L1 → REALIZED_VIA → SectorPolicyTool L1",
             "MATCH (a:SectorObjective {level:'L1'})-[:REALIZED_VIA]->(b:SectorPolicyTool {level:'L1'}) RETURN count(*) as c"),
            ("SectorPolicyTool L1 → PARENT_OF → SectorPolicyTool L2",
             "MATCH (a:SectorPolicyTool {level:'L1'})-[:PARENT_OF]->(b:SectorPolicyTool {level:'L2'}) RETURN count(*) as c"),
            ("SectorPolicyTool L2 → SETS_PRIORITIES → EntityCapability L2",
             "MATCH (a:SectorPolicyTool {level:'L2'})-[:SETS_PRIORITIES]->(b:EntityCapability {level:'L2'}) RETURN count(*) as c"),
            ("EntityCapability L2 → PARENT_OF → EntityCapability L3",
             "MATCH (a:EntityCapability {level:'L2'})-[:PARENT_OF]->(b:EntityCapability {level:'L3'}) RETURN count(*) as c"),
            ("EntityCapability L3 → ROLE/KNOWLEDGE/AUTOMATION_GAPS → Gap L3",
             "MATCH (a:EntityCapability {level:'L3'})-[r:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(b {level:'L3'}) RETURN count(*) as c"),
            ("Gap L3 → GAPS_SCOPE → EntityProject L3",
             "MATCH (a {level:'L3'})-[:GAPS_SCOPE]->(b:EntityProject {level:'L3'}) WHERE a:EntityOrgUnit OR a:EntityProcess OR a:EntityITSystem RETURN count(*) as c"),
            ("EntityProject L3 → ADOPTION_RISKS → EntityChangeAdoption L3",
             "MATCH (a:EntityProject {level:'L3'})-[:ADOPTION_RISKS]->(b:EntityChangeAdoption {level:'L3'}) RETURN count(*) as c"),
        ],
        "setting_strategic_priorities": [
            ("SectorObjective L1 → CASCADED_VIA → SectorPerformance L1",
             "MATCH (a:SectorObjective {level:'L1'})-[:CASCADED_VIA]->(b:SectorPerformance {level:'L1'}) RETURN count(*) as c"),
            ("SectorPerformance L1 → PARENT_OF → SectorPerformance L2",
             "MATCH (a:SectorPerformance {level:'L1'})-[:PARENT_OF]->(b:SectorPerformance {level:'L2'}) RETURN count(*) as c"),
            ("SectorPerformance L2 → SETS_TARGETS → EntityCapability L2",
             "MATCH (a:SectorPerformance {level:'L2'})-[:SETS_TARGETS]->(b:EntityCapability {level:'L2'}) RETURN count(*) as c"),
            ("EntityCapability L2 → PARENT_OF → EntityCapability L3",
             "MATCH (a:EntityCapability {level:'L2'})-[:PARENT_OF]->(b:EntityCapability {level:'L3'}) RETURN count(*) as c"),
            ("EntityCapability L3 → GAPS → Gap L3",
             "MATCH (a:EntityCapability {level:'L3'})-[r:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(b {level:'L3'}) RETURN count(*) as c"),
        ],
        "build_oversight": [
            ("EntityChangeAdoption L3 → INCREASE_ADOPTION → EntityProject L3",
             "MATCH (a:EntityChangeAdoption {level:'L3'})-[:INCREASE_ADOPTION]->(b:EntityProject {level:'L3'}) RETURN count(*) as c"),
            ("EntityProject L3 → CLOSE_GAPS → Gap L3",
             "MATCH (a:EntityProject {level:'L3'})-[:CLOSE_GAPS]->(b {level:'L3'}) WHERE b:EntityOrgUnit OR b:EntityProcess OR b:EntityITSystem RETURN count(*) as c"),
            ("Gap L3 → GAP_STATUS → EntityCapability L3",
             "MATCH (a {level:'L3'})-[:GAP_STATUS]->(b:EntityCapability {level:'L3'}) WHERE a:EntityOrgUnit OR a:EntityProcess OR a:EntityITSystem RETURN count(*) as c"),
            ("EntityCapability L3 → MONITORED_BY → EntityRisk L3",
             "MATCH (a:EntityCapability {level:'L3'})-[:MONITORED_BY]->(b:EntityRisk {level:'L3'}) RETURN count(*) as c"),
            ("EntityRisk L2 → PARENT_OF → EntityRisk L3 (reverse check)",
             "MATCH (a:EntityRisk {level:'L2'})-[:PARENT_OF]->(b:EntityRisk {level:'L3'}) RETURN count(*) as c"),
            ("EntityRisk L2 → INFORMS → SectorPolicyTool L2",
             "MATCH (a:EntityRisk {level:'L2'})-[:INFORMS]->(b:SectorPolicyTool {level:'L2'}) RETURN count(*) as c"),
            ("SectorPolicyTool L1 → GOVERNED_BY → SectorObjective L1",
             "MATCH (a:SectorPolicyTool {level:'L1'})-[:GOVERNED_BY]->(b:SectorObjective {level:'L1'}) RETURN count(*) as c"),
        ],
        "operate_oversight": [
            ("EntityCapability L3 → MONITORED_BY → EntityRisk L3",
             "MATCH (a:EntityCapability {level:'L3'})-[:MONITORED_BY]->(b:EntityRisk {level:'L3'}) RETURN count(*) as c"),
            ("EntityRisk L2 → PARENT_OF → EntityRisk L3 (reverse check)",
             "MATCH (a:EntityRisk {level:'L2'})-[:PARENT_OF]->(b:EntityRisk {level:'L3'}) RETURN count(*) as c"),
            ("EntityRisk L2 → INFORMS → SectorPerformance L2",
             "MATCH (a:EntityRisk {level:'L2'})-[:INFORMS]->(b:SectorPerformance {level:'L2'}) RETURN count(*) as c"),
            ("SectorPerformance L1 → PARENT_OF → SectorPerformance L2 (reverse check)",
             "MATCH (a:SectorPerformance {level:'L1'})-[:PARENT_OF]->(b:SectorPerformance {level:'L2'}) RETURN count(*) as c"),
            ("SectorPerformance L1 → AGGREGATES_TO → SectorObjective L1",
             "MATCH (a:SectorPerformance {level:'L1'})-[:AGGREGATES_TO]->(b:SectorObjective {level:'L1'}) RETURN count(*) as c"),
        ],
        "sustainable_operations": [
            ("EntityCultureHealth L3 → MONITORS_FOR → EntityOrgUnit L3",
             "MATCH (a:EntityCultureHealth {level:'L3'})-[:MONITORS_FOR]->(b:EntityOrgUnit {level:'L3'}) RETURN count(*) as c"),
            ("EntityOrgUnit L3 → APPLY → EntityProcess L3",
             "MATCH (a:EntityOrgUnit {level:'L3'})-[:APPLY]->(b:EntityProcess {level:'L3'}) RETURN count(*) as c"),
            ("EntityProcess L3 → AUTOMATION → EntityITSystem L3",
             "MATCH (a:EntityProcess {level:'L3'})-[:AUTOMATION]->(b:EntityITSystem {level:'L3'}) RETURN count(*) as c"),
            ("EntityITSystem L3 → DEPENDS_ON → EntityVendor L3",
             "MATCH (a:EntityITSystem {level:'L3'})-[:DEPENDS_ON]->(b:EntityVendor {level:'L3'}) RETURN count(*) as c"),
        ],
        "integrated_oversight": [
            ("SectorPolicyTool L2 → SETS_PRIORITIES → EntityCapability L2",
             "MATCH (a:SectorPolicyTool {level:'L2'})-[:SETS_PRIORITIES]->(b:EntityCapability {level:'L2'}) RETURN count(*) as c"),
            ("EntityCapability L2 → PARENT_OF → EntityCapability L3",
             "MATCH (a:EntityCapability {level:'L2'})-[:PARENT_OF]->(b:EntityCapability {level:'L3'}) RETURN count(*) as c"),
            ("EntityCapability L3 → GAPS → Gap L3",
             "MATCH (a:EntityCapability {level:'L3'})-[r:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(b {level:'L3'}) RETURN count(*) as c"),
            ("EntityCapability L3 ← MONITORED_BY ← EntityRisk L3 (reverse in query)",
             "MATCH (a:EntityCapability {level:'L3'})<-[:MONITORED_BY]-(b:EntityRisk {level:'L3'}) RETURN count(*) as c"),
            ("EntityRisk L2 → PARENT_OF → EntityRisk L3 (reverse check)",
             "MATCH (a:EntityRisk {level:'L2'})-[:PARENT_OF]->(b:EntityRisk {level:'L3'}) RETURN count(*) as c"),
            ("EntityRisk L2 → INFORMS → SectorPerformance L2",
             "MATCH (a:EntityRisk {level:'L2'})-[:INFORMS]->(b:SectorPerformance {level:'L2'}) RETURN count(*) as c"),
        ],
    }
    
    if chain_key in probes:
        for desc, query in probes[chain_key]:
            try:
                r = session.run(query)
                count = r.single()["c"]
                symbol = "✓" if count > 0 else "✗"
                print(f"     {symbol} {desc}: {count}")
            except Exception as e:
                print(f"     ⚠ {desc}: ERROR {str(e)[:80]}")


if __name__ == "__main__":
    main()
