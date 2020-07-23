pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps {
        git(credentialsId: 'c6aa486a-6522-4fc0-a3d2-7402fd7893c6', branch: 'unit-test', url: 'https://github.com/jayArnel/social-ape')
      }
    }

    stage('Install') {
      steps {
        dir(path: 'functions') {
          bat 'npm install'
        }

      }
    }

    stage('Test') {
      steps {
        bat 'npm test'
      }
    }

    stage('Publish') {
      parallel {
        stage('Coverage') {
          steps {
            cobertura(coberturaReportFile: '**/reports/coverage/cobertura-coverage.xml')
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