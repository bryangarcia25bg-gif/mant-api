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
                echo "Instalando pnpm globalmente..."
                bat 'npm install -g pnpm@9.1.0'

                echo "Instalando dependencias con pnpm..."
                bat '"%PNPM%" install --frozen-lockfile'

                echo "Auditando vulnerabilidades de seguridad..."
                bat '"%PNPM%" audit --audit-level=high'

                echo "Ejecutando tests con Jest..."
                bat '"%PNPM%" test'
            }
            post {
                failure { echo 'FALLO en tests o auditoria de seguridad.' }
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
                echo "Bajando servicios anteriores (sin borrar volumen)..."
                bat "docker compose down --remove-orphans 2>nul & exit 0"
                bat "docker stop mant-api-container 2>nul & exit 0"
                bat "docker rm   mant-api-container 2>nul & exit 0"

                echo "Levantando PostgreSQL + API..."
                bat "docker compose up -d"

                echo "Esperando que los servicios inicien..."
                bat "ping -n 41 127.0.0.1 > nul"

                echo "Verificando health check de la API..."
                bat "curl -f http://localhost:%PORT_HOST%/health"
            }
        }

        stage('Seed de base de datos') {
            steps {
                echo "Insertando datos iniciales si la tabla esta vacia..."
                bat """docker exec mant-api-db psql -U postgres -d mant_api -c ^
"INSERT INTO equipos (codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion) ^
SELECT * FROM (VALUES ^
  ('EQ-001','Compresor Atlas Copco GA55','Produccion','operativo','2026-05-10','2026-08-10',4320), ^
  ('EQ-002','Balanza Mettler Toledo ICS685','Pesaje','en_mantenimiento','2026-06-01','2026-09-01',2100), ^
  ('EQ-003','Faja Transportadora FT-12','Almacen','operativo','2026-04-15','2026-07-15',6800), ^
  ('EQ-004','Generador Cummins C500D5','Subestacion','fuera_de_servicio','2026-03-20','2026-06-20',9100), ^
  ('EQ-005','Bomba Hidraulica Grundfos CM10','Produccion','operativo','2026-05-20','2026-08-20',3200), ^
  ('EQ-006','Montacargas Toyota 8FGU25','Almacen','operativo','2026-04-28','2026-07-28',5400), ^
  ('EQ-007','Caldero Cleaver Brooks CB-200','Servicios','en_mantenimiento','2026-05-30','2026-08-30',7800), ^
  ('EQ-008','Compresor Kaeser SK19','Produccion','operativo','2026-05-05','2026-08-05',2900), ^
  ('EQ-009','Transformador ABB 500KVA','Subestacion','operativo','2026-03-10','2026-09-10',11200), ^
  ('EQ-010','Banda Transportadora BT-07','Almacen','fuera_de_servicio','2026-02-15','2026-05-15',14300) ^
) AS d(codigo,nombre,area,estado,ultimo_mantenimiento,proximo_mantenimiento,horas_operacion) ^
WHERE NOT EXISTS (SELECT 1 FROM equipos LIMIT 1);" 2>nul & exit 0"""

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
