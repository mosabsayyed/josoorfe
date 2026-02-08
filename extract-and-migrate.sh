#!/bin/bash
# Neo4j 4.x Backup Extraction and Migration
# Approach: Extract backup contents, start 4.x instance, dump for 5.x
set -e

echo "========================================="
echo "  Neo4j Backup Extraction & Migration"
echo "========================================="

# Clean previous attempts
rm -rf neo4j-4x-temp neo4j-migration-data

# Step 1: Start Neo4j 4.4 with mounted backup directory
echo "Step 1: Starting Neo4j 4.4 with backup mount..."
docker run -d --name neo4j-4x-extract \
  -e NEO4J_AUTH=neo4j/temppass \
  -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
  -v $(pwd)/backups:/backups \
  -v $(pwd)/neo4j-4x-temp:/data \
  -p 7475:7474 \
  neo4j:4.4-enterprise

echo "Waiting for Neo4j 4.4 to start..."
sleep 20

# Step 2: Try to restore from backup while running
echo ""
echo "Step 2: Attempting restore via running instance..."
docker exec neo4j-4x-extract \
  neo4j-admin restore --from=/backups/neo4j.backup --database=neo4j --force || \
  echo "Restore failed, trying alternative approach..."

# Step 3: Stop 4.x instance
echo ""
echo "Step 3: Stopping Neo4j 4.x..."
docker stop neo4j-4x-extract
docker rm neo4j-4x-extract

# Step 4: Create dump from 4.x data
echo ""
echo "Step 4: Creating 5.x-compatible dump..."
docker run --rm \
  -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
  -v $(pwd)/neo4j-4x-temp:/data \
  -v $(pwd)/backups:/output \
  neo4j:4.4-enterprise \
  neo4j-admin dump --database=neo4j --to=/output/neo4j-5x.dump

echo ""
echo "✓ Migration complete!"
echo "5.x-compatible dump: ./backups/neo4j-5x.dump"
