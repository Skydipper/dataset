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
        \
        STAGING="" \
        IMAGE_NAME=$(cat docker-compose-v3.yml | shyaml get-value services.prod.image) \
        IMAGE_NAME_NEW=$(eval echo $IMAGE_NAME) \
         \
        IFS=':' read -ra ADDR <<< "$IMAGE_NAME_NEW" \
         \
         \
        if docker_tag_exists ${ADDR[0]} ${ADDR[1]}; then    \
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
