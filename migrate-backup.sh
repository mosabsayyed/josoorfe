#!/bin/bash
# Migrate Neo4j 4.x backup to 5.x format
# Database Admin Best Practice: Version-specific tooling for migration
set -e

echo "========================================"
echo "  Neo4j Backup Migration (4.x → 5.x)"
echo "========================================"

# Clean any previous migration attempts
rm -rf neo4j-migration-data

# Step 1: Use Neo4j 4.4 to load the BZV2 backup
echo "Step 1: Loading 4.x backup with neo4j-admin load..."
docker run --rm \
  -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
  -v $(pwd)/backups:/backups \
  -v $(pwd)/neo4j-migration-data:/data \
  neo4j:4.4-enterprise \
  neo4j-admin load --from=/backups/neo4j.backup --database=neo4j --force

# Step 2: Start Neo4j 4.4 briefly to verify
echo ""
echo "Step 2: Starting Neo4j 4.4 to verify..."
docker run -d --name neo4j-migrate-temp \
  -e NEO4J_AUTH=neo4j/temppassword \
  -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
  -v $(pwd)/neo4j-migration-data:/data \
  neo4j:4.4-enterprise

sleep 15
docker stop neo4j-migrate-temp
docker rm neo4j-migrate-temp

# Step 3: Create dump in 5.x format
echo ""
echo "Step 3: Creating dump in 5.x format..."
docker run --rm \
  -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
  -v $(pwd)/neo4j-migration-data:/data \
  -v $(pwd)/backups:/output \
  neo4j:4.4-enterprise \
  neo4j-admin dump --database=neo4j --to=/output/neo4j-5x.dump

echo ""
echo "✓ Migration complete!"
echo "New dump file: ./backups/neo4j-5x.dump"
echo ""
echo "Next: Update setup-staging.sh to use neo4j-5x.dump"
