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
        echo "entra1"
        STAGING="" \
        echo "entra2"
        IMAGE_NAME=$(cat docker-compose-v3.yml | shyaml get-value services.prod.image) \
        echo "entra3"
        IMAGE_NAME_NEW=$(eval echo $IMAGE_NAME) \
        echo "entra4"
        IFS=':' read -ra ADDR <<< "$IMAGE_NAME_NEW" 
        echo "entra5"

        echo "entra"
        if curl --silent -f -lSL https://hub.docker.com/v2/repositories/${ADDR[0]}/tags/${ADDR[1]} > /dev/null; then    \
            echo "Error! Image with name ${IMAGE_NAME_NEW} exists!!!! " 1>&2 \
            exit 1 \
        else  \
          echo "Building"          \
        fi \
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
