#!/bin/bash
# Setup Neo4j Staging Environment
# Usage: ./setup-staging.sh

set -e

echo "========================================="
echo "  Neo4j Staging Environment Setup"
echo "========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup exists
BACKUP_FILE="./backups/neo4j.backup"
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}⚠ Backup file not found at: $BACKUP_FILE${NC}"
    echo "Please place the production backup at: ./backups/neo4j.backup"
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✓${NC} Backup file found"

# Stop and remove existing staging container
echo ""
echo "Stopping existing staging container (if any)..."
docker-compose -f docker-compose.neo4j-staging.yml down -v 2>/dev/null || true

# Clean staging data
echo "Cleaning staging data directories..."
rm -rf ./neo4j-staging-data/* 2>/dev/null || true
rm -rf ./neo4j-staging-logs/* 2>/dev/null || true
mkdir -p ./neo4j-staging-data ./neo4j-staging-logs ./neo4j-staging-import

echo -e "${GREEN}✓${NC} Directories cleaned"

# Start Neo4j container
echo ""
echo "Starting Neo4j staging container..."
docker-compose -f docker-compose.neo4j-staging.yml up -d

# Wait for Neo4j to be ready
echo ""
echo "Waiting for Neo4j to initialize..."
for i in {1..30}; do
    if docker exec josoor-neo4j-staging cypher-shell -u neo4j -p stagingpassword "RETURN 1" &>/dev/null; then
        echo -e "${GREEN}✓${NC} Neo4j is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Timeout waiting for Neo4j"
        exit 1
    fi
    echo -n "."
    sleep 2
done

# Stop Neo4j for database restoration
echo ""
echo "Stopping Neo4j for database restoration..."
docker-compose -f docker-compose.neo4j-staging.yml stop

# Restore database from backup
echo ""
echo "Restoring database from backup..."
docker run --rm \
  -e NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
  -v $(pwd)/backups:/backups \
  -v $(pwd)/neo4j-staging-data:/data \
  neo4j:5.15-enterprise \
  neo4j-admin database restore neo4j --from-path=/backups/neo4j.backup --overwrite-destination=true

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database restored successfully"
else
    echo -e "${RED}✗${NC} Database restoration failed"
    exit 1
fi

# Restart Neo4j
echo ""
echo "Starting Neo4j with restored data..."
docker-compose -f docker-compose.neo4j-staging.yml up -d

# Wait for Neo4j to be ready again
echo "Waiting for Neo4j to start..."
for i in {1..30}; do
    if docker exec josoor-neo4j-staging cypher-shell -u neo4j -p stagingpassword "RETURN 1" &>/dev/null; then
        echo -e "${GREEN}✓${NC} Neo4j is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Timeout waiting for Neo4j"
        exit 1
    fi
    echo -n "."
    sleep 2
done

# Verify data
echo ""
echo "Verifying restored data..."
NODE_COUNT=$(docker exec josoor-neo4j-staging cypher-shell -u neo4j -p stagingpassword \
  "MATCH (n) RETURN count(n) AS count" --format plain | tail -n 1)

echo -e "${GREEN}✓${NC} Database contains $NODE_COUNT nodes"

echo ""
echo "========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Neo4j Staging Environment:"
echo "  - Browser: http://localhost:7475"
echo "  - Bolt:    bolt://localhost:7688"
echo "  - User:    neo4j"
echo "  - Pass:    stagingpassword"
echo ""
echo "Next steps:"
echo "  1. Install dependencies: npm install neo4j-driver"
echo "  2. Run gap-filler: node gap-filler.js"
echo ""
