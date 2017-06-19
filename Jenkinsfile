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
        function docker_tag_exists() { \
            curl --silent -f -lSL https://hub.docker.com/v2/repositories/$1/tags/$2 > /dev/null \
        } \
        echo "hola2"
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
