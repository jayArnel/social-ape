pipeline {
  agent any
  stages {
    stage('Install') {
      steps {
        dir(path: 'functions') {
          nodejs('node14') {
            sh 'npm install'
          }

        }

      }
    }

    stage('Test') {
      steps {
        dir(path: 'functions') {
          nodejs('node14') {
            sh 'npm test'
          }

        }

      }
    }

    stage('Publish') {
      parallel {
        stage('Coverage') {
          steps {
            cobertura(coberturaReportFile: '**/reports/coverage/cobertura-coverage.xml', sourceEncoding: 'ASCII', zoomCoverageChart: true)
          }
        }

        stage('Test results') {
          steps {
            junit '**/reports/junit.xml'
          }
        }

      }
    }

  }
}