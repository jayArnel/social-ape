pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps {
        git(credentialsId: 'c6aa486a-6522-4fc0-a3d2-7402fd7893c6', branch: 'unit-test', url: 'https://github.com/jayArnel/social-ape')
      }
    }

    stage('Test') {
      steps {
        bat 'cd functions'
        bat 'npm install'
        bat 'npm test'
      }
    }

    stage('Publish') {
      steps {
        cobertura(coberturaReportFile: '**/reports/coverage/cobertura-coverage.xml')
        junit '**/reports/junit.xml'
      }
    }

  }
}