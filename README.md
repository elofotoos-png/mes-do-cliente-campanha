services:
  - type: web
    name: mes-do-cliente-campanha
    runtime: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 22
      - key: DB_PATH
        value: /var/data/mes-do-cliente.db
    disk:
      name: mes-do-cliente-disk
      mountPath: /var/data
      sizeGB: 1
