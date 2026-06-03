pipeline {
    agent any

    environment {
        IMAGE_NAME = "mant-api"
        IMAGE_TAG  = "build-${BUILD_NUMBER}"
        PORT_HOST  = "3000"
        CORREO     = "tucorreo@gmail.com"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Clonando repositorio desde GitHub..."
                checkout scm
                echo "Código descargado. Rama: ${env.GIT_BRANCH ?: 'main'}"
            }
        }

        stage('Instalar dependencias y correr tests') {
            steps {
                echo "Instalando dependencias de Node.js..."
                bat 'npm install'

                echo "Ejecutando tests con Jest..."
                bat 'npm test'
            }
            post {
                always {
                    echo "Tests finalizados. Revisando resultados..."
                }
                failure {
                    echo "FALLO en los tests. Abortando pipeline."
                }
            }
        }

        stage('Build imagen Docker') {
            steps {
                echo "Construyendo imagen Docker: ${IMAGE_NAME}:${IMAGE_TAG}"
                bat "docker build -t %IMAGE_NAME%:%IMAGE_TAG% ."
                bat "docker tag %IMAGE_NAME%:%IMAGE_TAG% %IMAGE_NAME%:latest"
                echo "Imagen construida exitosamente."
            }
        }

        stage('Deploy contenedor') {
            steps {
                echo "Deteniendo contenedor anterior si existe..."
                bat "docker stop %IMAGE_NAME%-container || echo No habia contenedor previo"
                bat "docker rm   %IMAGE_NAME%-container || echo Nada que eliminar"

                echo "Iniciando nuevo contenedor en puerto ${PORT_HOST}..."
                bat "docker run -d --name %IMAGE_NAME%-container -p %PORT_HOST%:3000 %IMAGE_NAME%:latest"

                echo "Verificando que la API responde..."
                bat "ping -n 6 127.0.0.1 > nul"
                bat "curl -f http://localhost:%PORT_HOST%/health"
            }
        }
    }

    post {
        success {
            echo "Pipeline completado exitosamente. API disponible en http://localhost:${PORT_HOST}"
            emailext(
                to: "${CORREO}",
                subject: "OK - mant-api desplegada | Build #${BUILD_NUMBER}",
                body: """Pipeline exitoso.

Build:    #${BUILD_NUMBER}
Estado:   EXITOSO
API URL:  http://localhost:${PORT_HOST}/equipos
Resumen:  http://localhost:${PORT_HOST}/equipos/resumen

Ver log completo: ${BUILD_URL}console"""
            )
        }
        failure {
            echo "El pipeline FALLÓ. Revisar el log en Jenkins."
            emailext(
                to: "${CORREO}",
                subject: "ERROR - mant-api falló | Build #${BUILD_NUMBER}",
                body: """El pipeline falló.

Build:  #${BUILD_NUMBER}
Stage:  ${env.STAGE_NAME ?: 'desconocido'}

Ver log: ${BUILD_URL}console"""
            )
        }
        always {
            echo "Limpiando imágenes Docker antiguas..."
            bat "docker image prune -f"
        }
    }
}
