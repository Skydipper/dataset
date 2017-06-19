#!groovy

node {

  currentBuild.result = "SUCCESS"
  def PROJECT = 'dataset'

  // checkout sources
  checkout scm

  try {

    stage('Build Docker') {

      print "Publishing container"

      sh '''  \
        echo "hola"
      '''

    }


  } catch (err) {

    currentBuild.result = "FAILURE"
    // mail body: "project build error is here: ${env.BUILD_URL}" ,
    // from: 'xxxx@yyyy.com',
    // replyTo: 'yyyy@yyyy.com',
    // subject: 'project build failed',
    // to: 'zzzz@yyyyy.com'

    throw err
  }

}
