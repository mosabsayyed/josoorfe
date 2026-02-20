#!/usr/bin/env python3
"""
Count orphans and bastards per relationship link across all 7 chains.
- Orphan = source node with NO outgoing rel of expected type to expected target
- Bastard = target node with NO incoming rel of expected type from expected source
"""
import warnings
warnings.filterwarnings('ignore')
from neo4j import GraphDatabase

URI = "bolt://localhost:7688"
USER = "neo4j"
PASS = "stagingpassword"

LINKS = [
    # VALUE CHAIN
    ("SVC: Objective L1 -REALIZED_VIA-> PolicyTool L1",
     "MATCH (n:SectorObjective {level:'L1'}) WHERE NOT (n)-[:REALIZED_VIA]->(:SectorPolicyTool {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorPolicyTool {level:'L1'}) WHERE NOT (:SectorObjective {level:'L1'})-[:REALIZED_VIA]->(n) RETURN count(n) AS c"),
    ("SVC: PolicyTool L1 -REFERS_TO-> AdminRecord L1",
     "MATCH (n:SectorPolicyTool {level:'L1'}) WHERE NOT (n)-[:REFERS_TO]->(:SectorAdminRecord {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorAdminRecord {level:'L1'}) WHERE NOT (:SectorPolicyTool {level:'L1'})-[:REFERS_TO]->(n) RETURN count(n) AS c"),
    ("SVC: AdminRecord L1 -APPLIED_ON-> Stakeholder L1",
     "MATCH (n:SectorAdminRecord {level:'L1'}) WHERE NOT EXISTS { MATCH (n)-[:APPLIED_ON]->(m {level:'L1'}) WHERE m:SectorBusiness OR m:SectorCitizen OR m:SectorGovEntity } RETURN count(n) AS c",
     "MATCH (n {level:'L1'}) WHERE (n:SectorBusiness OR n:SectorCitizen OR n:SectorGovEntity) AND NOT (:SectorAdminRecord {level:'L1'})-[:APPLIED_ON]->(n) RETURN count(n) AS c"),
    ("SVC: Stakeholder L1 -TRIGGERS_EVENT-> DataTx L1",
     "MATCH (n {level:'L1'}) WHERE (n:SectorBusiness OR n:SectorCitizen OR n:SectorGovEntity) AND NOT (n)-[:TRIGGERS_EVENT]->(:SectorDataTransaction {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorDataTransaction {level:'L1'}) WHERE NOT EXISTS { MATCH (m {level:'L1'})-[:TRIGGERS_EVENT]->(n) WHERE m:SectorBusiness OR m:SectorCitizen OR m:SectorGovEntity } RETURN count(n) AS c"),
    ("SVC: DataTx L1 -MEASURED_BY-> Performance L1",
     "MATCH (n:SectorDataTransaction {level:'L1'}) WHERE NOT (n)-[:MEASURED_BY]->(:SectorPerformance {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorPerformance {level:'L1'}) WHERE NOT (:SectorDataTransaction {level:'L1'})-[:MEASURED_BY]->(n) RETURN count(n) AS c"),
    ("SVC: Performance L1 -AGGREGATES_TO-> Objective L1",
     "MATCH (n:SectorPerformance {level:'L1'}) WHERE NOT (n)-[:AGGREGATES_TO]->(:SectorObjective {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorObjective {level:'L1'}) WHERE NOT (:SectorPerformance {level:'L1'})-[:AGGREGATES_TO]->(n) RETURN count(n) AS c"),

    # STRATEGIC INITIATIVES
    ("SSI: PolicyTool L1 -PARENT_OF-> PolicyTool L2",
     "MATCH (n:SectorPolicyTool {level:'L1'}) WHERE NOT (n)-[:PARENT_OF]->(:SectorPolicyTool {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:SectorPolicyTool {level:'L2'}) WHERE NOT (:SectorPolicyTool {level:'L1'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("SSI: PolicyTool L2 -SETS_PRIORITIES-> Capability L2",
     "MATCH (n:SectorPolicyTool {level:'L2'}) WHERE NOT (n)-[:SETS_PRIORITIES]->(:EntityCapability {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:EntityCapability {level:'L2'}) WHERE NOT (:SectorPolicyTool {level:'L2'})-[:SETS_PRIORITIES]->(n) RETURN count(n) AS c"),
    ("SSI: Capability L2 -PARENT_OF-> Capability L3",
     "MATCH (n:EntityCapability {level:'L2'}) WHERE NOT (n)-[:PARENT_OF]->(:EntityCapability {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT (:EntityCapability {level:'L2'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("SSI: Cap L3 -GAPS-> OrgUnit/Process/IT L3",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT EXISTS { MATCH (n)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(m {level:'L3'}) WHERE m:EntityOrgUnit OR m:EntityProcess OR m:EntityITSystem } RETURN count(n) AS c",
     "MATCH (n {level:'L3'}) WHERE (n:EntityOrgUnit OR n:EntityProcess OR n:EntityITSystem) AND NOT (:EntityCapability {level:'L3'})-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(n) RETURN count(n) AS c"),
    ("SSI: Gap L3 -GAPS_SCOPE-> Project L3",
     "MATCH (n {level:'L3'}) WHERE (n:EntityOrgUnit OR n:EntityProcess OR n:EntityITSystem) AND NOT (n)-[:GAPS_SCOPE]->(:EntityProject {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityProject {level:'L3'}) WHERE NOT EXISTS { MATCH (m {level:'L3'})-[:GAPS_SCOPE]->(n) WHERE m:EntityOrgUnit OR m:EntityProcess OR m:EntityITSystem } RETURN count(n) AS c"),
    ("SSI: Project L3 -ADOPTION_RISKS-> ChangeAdopt L3",
     "MATCH (n:EntityProject {level:'L3'}) WHERE NOT (n)-[:ADOPTION_RISKS]->(:EntityChangeAdoption {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityChangeAdoption {level:'L3'}) WHERE NOT (:EntityProject {level:'L3'})-[:ADOPTION_RISKS]->(n) RETURN count(n) AS c"),

    # STRATEGIC PRIORITIES
    ("SSP: Objective L1 -CASCADED_VIA-> Performance L1",
     "MATCH (n:SectorObjective {level:'L1'}) WHERE NOT (n)-[:CASCADED_VIA]->(:SectorPerformance {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorPerformance {level:'L1'}) WHERE NOT (:SectorObjective {level:'L1'})-[:CASCADED_VIA]->(n) RETURN count(n) AS c"),
    ("SSP: Performance L1 -PARENT_OF-> Performance L2",
     "MATCH (n:SectorPerformance {level:'L1'}) WHERE NOT (n)-[:PARENT_OF]->(:SectorPerformance {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:SectorPerformance {level:'L2'}) WHERE NOT (:SectorPerformance {level:'L1'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("SSP: Performance L2 -SETS_TARGETS-> Capability L2",
     "MATCH (n:SectorPerformance {level:'L2'}) WHERE NOT (n)-[:SETS_TARGETS]->(:EntityCapability {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:EntityCapability {level:'L2'}) WHERE NOT (:SectorPerformance {level:'L2'})-[:SETS_TARGETS]->(n) RETURN count(n) AS c"),

    # BUILD OVERSIGHT
    ("BO: ChangeAdopt L3 -INCREASE_ADOPTION-> Project L3",
     "MATCH (n:EntityChangeAdoption {level:'L3'}) WHERE NOT (n)-[:INCREASE_ADOPTION]->(:EntityProject {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityProject {level:'L3'}) WHERE NOT (:EntityChangeAdoption {level:'L3'})-[:INCREASE_ADOPTION]->(n) RETURN count(n) AS c"),
    ("BO: Project L3 -CLOSE_GAPS-> Gap L3",
     "MATCH (n:EntityProject {level:'L3'}) WHERE NOT EXISTS { MATCH (n)-[:CLOSE_GAPS]->(m {level:'L3'}) WHERE m:EntityOrgUnit OR m:EntityProcess OR m:EntityITSystem } RETURN count(n) AS c",
     "MATCH (n {level:'L3'}) WHERE (n:EntityOrgUnit OR n:EntityProcess OR n:EntityITSystem) AND NOT (:EntityProject {level:'L3'})-[:CLOSE_GAPS]->(n) RETURN count(n) AS c"),
    ("BO: Gap L3 -GAP_STATUS-> Capability L3",
     "MATCH (n {level:'L3'}) WHERE (n:EntityOrgUnit OR n:EntityProcess OR n:EntityITSystem) AND NOT (n)-[:GAP_STATUS]->(:EntityCapability {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT EXISTS { MATCH (m {level:'L3'})-[:GAP_STATUS]->(n) WHERE m:EntityOrgUnit OR m:EntityProcess OR m:EntityITSystem } RETURN count(n) AS c"),
    ("BO: Capability L3 -MONITORED_BY-> Risk L3",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT (n)-[:MONITORED_BY]->(:EntityRisk {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityRisk {level:'L3'}) WHERE NOT (:EntityCapability {level:'L3'})-[:MONITORED_BY]->(n) RETURN count(n) AS c"),
    ("BO: Risk L2 -PARENT_OF-> Risk L3",
     "MATCH (n:EntityRisk {level:'L2'}) WHERE NOT (n)-[:PARENT_OF]->(:EntityRisk {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityRisk {level:'L3'}) WHERE NOT (:EntityRisk {level:'L2'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("BO: Risk L2 -INFORMS-> PolicyTool L2",
     "MATCH (n:EntityRisk {level:'L2'}) WHERE NOT (n)-[:INFORMS]->(:SectorPolicyTool {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:SectorPolicyTool {level:'L2'}) WHERE NOT (:EntityRisk {level:'L2'})-[:INFORMS]->(n) RETURN count(n) AS c"),
    ("BO: PolicyTool L1 -GOVERNED_BY-> Objective L1",
     "MATCH (n:SectorPolicyTool {level:'L1'}) WHERE NOT (n)-[:GOVERNED_BY]->(:SectorObjective {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorObjective {level:'L1'}) WHERE NOT (:SectorPolicyTool {level:'L1'})-[:GOVERNED_BY]->(n) RETURN count(n) AS c"),

    # OPERATE OVERSIGHT
    ("OO: Capability L3 -MONITORED_BY-> Risk L3",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT (n)-[:MONITORED_BY]->(:EntityRisk {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityRisk {level:'L3'}) WHERE NOT (:EntityCapability {level:'L3'})-[:MONITORED_BY]->(n) RETURN count(n) AS c"),
    ("OO: Risk L2 -PARENT_OF-> Risk L3",
     "MATCH (n:EntityRisk {level:'L2'}) WHERE NOT (n)-[:PARENT_OF]->(:EntityRisk {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityRisk {level:'L3'}) WHERE NOT (:EntityRisk {level:'L2'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("OO: Risk L2 -INFORMS-> Performance L2",
     "MATCH (n:EntityRisk {level:'L2'}) WHERE NOT (n)-[:INFORMS]->(:SectorPerformance {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:SectorPerformance {level:'L2'}) WHERE NOT (:EntityRisk {level:'L2'})-[:INFORMS]->(n) RETURN count(n) AS c"),
    ("OO: Performance L1 -PARENT_OF-> Performance L2",
     "MATCH (n:SectorPerformance {level:'L1'}) WHERE NOT (n)-[:PARENT_OF]->(:SectorPerformance {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:SectorPerformance {level:'L2'}) WHERE NOT (:SectorPerformance {level:'L1'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("OO: Performance L1 -AGGREGATES_TO-> Objective L1",
     "MATCH (n:SectorPerformance {level:'L1'}) WHERE NOT (n)-[:AGGREGATES_TO]->(:SectorObjective {level:'L1'}) RETURN count(n) AS c",
     "MATCH (n:SectorObjective {level:'L1'}) WHERE NOT (:SectorPerformance {level:'L1'})-[:AGGREGATES_TO]->(n) RETURN count(n) AS c"),

    # SUSTAINABLE OPERATIONS
    ("SO: CultureHealth L3 -MONITORS_FOR-> OrgUnit L3",
     "MATCH (n:EntityCultureHealth {level:'L3'}) WHERE NOT (n)-[:MONITORS_FOR]->(:EntityOrgUnit {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityOrgUnit {level:'L3'}) WHERE NOT (:EntityCultureHealth {level:'L3'})-[:MONITORS_FOR]->(n) RETURN count(n) AS c"),
    ("SO: OrgUnit L3 -APPLY-> Process L3",
     "MATCH (n:EntityOrgUnit {level:'L3'}) WHERE NOT (n)-[:APPLY]->(:EntityProcess {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityProcess {level:'L3'}) WHERE NOT (:EntityOrgUnit {level:'L3'})-[:APPLY]->(n) RETURN count(n) AS c"),
    ("SO: Process L3 -AUTOMATION-> ITSystem L3",
     "MATCH (n:EntityProcess {level:'L3'}) WHERE NOT (n)-[:AUTOMATION]->(:EntityITSystem {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityITSystem {level:'L3'}) WHERE NOT (:EntityProcess {level:'L3'})-[:AUTOMATION]->(n) RETURN count(n) AS c"),
    ("SO: ITSystem L3 -DEPENDS_ON-> Vendor L3",
     "MATCH (n:EntityITSystem {level:'L3'}) WHERE NOT (n)-[:DEPENDS_ON]->(:EntityVendor {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityVendor {level:'L3'}) WHERE NOT (:EntityITSystem {level:'L3'})-[:DEPENDS_ON]->(n) RETURN count(n) AS c"),

    # INTEGRATED OVERSIGHT
    ("IO: PolicyTool L2 -SETS_PRIORITIES-> Capability L2",
     "MATCH (n:SectorPolicyTool {level:'L2'}) WHERE NOT (n)-[:SETS_PRIORITIES]->(:EntityCapability {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:EntityCapability {level:'L2'}) WHERE NOT (:SectorPolicyTool {level:'L2'})-[:SETS_PRIORITIES]->(n) RETURN count(n) AS c"),
    ("IO: Cap L3 -GAPS-> OrgUnit/Process/IT L3",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT EXISTS { MATCH (n)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(m {level:'L3'}) WHERE m:EntityOrgUnit OR m:EntityProcess OR m:EntityITSystem } RETURN count(n) AS c",
     "MATCH (n {level:'L3'}) WHERE (n:EntityOrgUnit OR n:EntityProcess OR n:EntityITSystem) AND NOT (:EntityCapability {level:'L3'})-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(n) RETURN count(n) AS c"),
    ("IO: Cap L3 <-MONITORED_BY- Risk L3",
     "MATCH (n:EntityCapability {level:'L3'}) WHERE NOT (n)<-[:MONITORED_BY]-(:EntityRisk {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityRisk {level:'L3'}) WHERE NOT (n)-[:MONITORED_BY]->(:EntityCapability {level:'L3'}) RETURN count(n) AS c"),
    ("IO: Risk L2 -PARENT_OF-> Risk L3",
     "MATCH (n:EntityRisk {level:'L2'}) WHERE NOT (n)-[:PARENT_OF]->(:EntityRisk {level:'L3'}) RETURN count(n) AS c",
     "MATCH (n:EntityRisk {level:'L3'}) WHERE NOT (:EntityRisk {level:'L2'})-[:PARENT_OF]->(n) RETURN count(n) AS c"),
    ("IO: Risk L2 -INFORMS-> Performance L2",
     "MATCH (n:EntityRisk {level:'L2'}) WHERE NOT (n)-[:INFORMS]->(:SectorPerformance {level:'L2'}) RETURN count(n) AS c",
     "MATCH (n:SectorPerformance {level:'L2'}) WHERE NOT (:EntityRisk {level:'L2'})-[:INFORMS]->(n) RETURN count(n) AS c"),
]

def main():
    driver = GraphDatabase.driver(URI, auth=(USER, PASS))

    with driver.session() as s:
        # DB stats
        nodes = s.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        rels = s.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]

        print("=" * 75)
        print(f"  ORPHAN / BASTARD REPORT — STAGING ({nodes:,} nodes, {rels:,} rels)")
        print("=" * 75)
        print(f"\n{'LINK':<52s} {'ORPHANS':>8s} {'BASTARDS':>9s}")
        print("-" * 75)

        total_o = 0
        total_b = 0
        current_chain = ""

        for desc, oq, bq in LINKS:
            chain = desc.split(":")[0]
            if chain != current_chain:
                current_chain = chain
                print()

            try:
                o = s.run(oq).single()["c"]
            except Exception as e:
                o = f"ERR:{str(e)[:30]}"
            try:
                b = s.run(bq).single()["c"]
            except Exception as e:
                b = f"ERR:{str(e)[:30]}"

            flag = ""
            if (isinstance(o, int) and o > 0) or (isinstance(b, int) and b > 0):
                flag = " <<<"

            if isinstance(o, int):
                total_o += o
            if isinstance(b, int):
                total_b += b

            print(f"  {desc:<50s} {str(o):>8s} {str(b):>9s}{flag}")

        print()
        print("=" * 75)
        print(f"  {'TOTALS':<50s} {total_o:>8d} {total_b:>9d}")
        print("=" * 75)
        print(f"\n  <<< = has orphans or bastards that need attention")

    driver.close()


if __name__ == "__main__":
    main()
