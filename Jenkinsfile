pipeline {
    agent any

    environment {
        IMAGE_NAME  = "mant-api"
        IMAGE_TAG   = "build-${BUILD_NUMBER}"
        PORT_HOST   = "3000"
        CORREO      = "tucorreo@gmail.com"
        DOCKER_HOST = "tcp://localhost:2375"
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
                bat 'npm install'
                bat 'npm test'
            }
            post {
                failure { echo 'FALLO en los tests. Abortando pipeline.' }
            }
        }

        stage('Build imagen Docker') {
            steps {
                echo "Construyendo imagen: ${IMAGE_NAME}:${IMAGE_TAG}"
                bat "docker build -t %IMAGE_NAME%:%IMAGE_TAG% ."
                bat "docker tag %IMAGE_NAME%:%IMAGE_TAG% %IMAGE_NAME%:latest"
                echo "Imagen construida exitosamente."
            }
        }

        stage('Deploy con Docker Compose') {
            steps {
                echo "Bajando servicios anteriores..."
                bat "docker compose down --remove-orphans 2>nul & exit 0"

                echo "Eliminando contenedor huerfano si existe..."
                bat "docker stop mant-api-container 2>nul & exit 0"
                bat "docker rm   mant-api-container 2>nul & exit 0"

                echo "Levantando PostgreSQL + API..."
                bat "docker compose up -d --build"

                echo "Esperando que los servicios inicien..."
                bat "ping -n 15 127.0.0.1 > nul"

                echo "Verificando health check de la API..."
                bat "curl -f http://localhost:%PORT_HOST%/health"
            }
        }
    }

    post {
        success {
            echo "Pipeline completado. API + PostgreSQL corriendo en puerto ${PORT_HOST}."
            emailext(
                to: "${CORREO}",
                subject: "OK - mant-api v2 desplegada | Build #${BUILD_NUMBER}",
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
