pipeline {
    agent any

    environment {
        IMAGE_NAME  = "mant-api"
        IMAGE_TAG   = "build-${BUILD_NUMBER}"
        PORT_HOST   = "3000"
        CORREO      = "tucorreo@gmail.com"
        DOCKER_HOST = "tcp://localhost:2375"
        PNPM        = "C:\\WINDOWS\\system32\\config\\systemprofile\\AppData\\Roaming\\npm\\pnpm.cmd"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Clonando repositorio desde GitHub..."
                checkout scm
                echo "Rama: ${env.GIT_BRANCH ?: 'main'}"
            }
        }

        stage('Instalar dependencias y correr tests') {
            steps {
                bat 'npm install -g pnpm@9.1.0'
                bat '"%PNPM%" install --frozen-lockfile'
                bat '"%PNPM%" audit --audit-level=high'
                bat '"%PNPM%" test'
            }
            post {
                failure { echo 'FALLO en tests o auditoria de seguridad.' }
            }
        }

        stage('Build imagen Docker') {
            steps {
                bat "docker build -t %IMAGE_NAME%:%IMAGE_TAG% ."
                bat "docker tag %IMAGE_NAME%:%IMAGE_TAG% %IMAGE_NAME%:latest"
            }
        }

        stage('Deploy con Docker Compose') {
            steps {
                bat "docker compose down --remove-orphans 2>nul & exit 0"
                bat "docker stop mant-api-container 2>nul & exit 0"
                bat "docker rm   mant-api-container 2>nul & exit 0"
                bat "docker compose up -d"
                bat "ping -n 41 127.0.0.1 > nul"
                bat "curl -f http://localhost:%PORT_HOST%/health"
            }
        }

        stage('Seed de base de datos') {
            steps {
                echo "Copiando script SQL al contenedor..."
                bat "docker cp db/seed.sql mant-api-db:/seed.sql"

                echo "Insertando datos iniciales si la tabla esta vacia..."
                bat "docker exec mant-api-db psql -U postgres -d mant_api -f /seed.sql"

                echo "Verificando datos en base de datos..."
                bat "curl -f http://localhost:%PORT_HOST%/equipos/resumen"
            }
        }
    }

    post {
        success {
            echo "Pipeline completado. API + PostgreSQL corriendo en puerto ${PORT_HOST}."
            emailext(
                to: "${CORREO}",
                subject: "OK - mant-api desplegada | Build #${BUILD_NUMBER}",
                body: """Pipeline exitoso.

Build:    #${BUILD_NUMBER}
API:      http://localhost:${PORT_HOST}/equipos
Resumen:  http://localhost:${PORT_HOST}/equipos/resumen
Health:   http://localhost:${PORT_HOST}/health

Ver log: ${BUILD_URL}console"""
            )
        }
        failure {
            emailext(
                to: "${CORREO}",
                subject: "ERROR - mant-api | Build #${BUILD_NUMBER}",
                body: "El pipeline fallo. Ver log: ${BUILD_URL}console"
            )
        }
        always {
            bat "docker image prune -f 2>nul & exit 0"
        }
    }
}
