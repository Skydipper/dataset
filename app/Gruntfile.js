
module.exports = (grunt) => {

    grunt.file.setBase('..');
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        express: {
            dev: {
                options: {
                    script: 'app/index.js',
                    node_env: 'dev',
                    port: process.env.PORT,
                    output: 'started'
                }
            }
        },

        mocha_istanbul: {
            coverage: {
                src: 'app/test', // the folder, not the files
                options: {
                    coverageFolder: 'coverage',
                    mask: '**/*.spec.js',
                    root: 'app/src',
                    nodeExec: require.resolve('.bin/babel-node'),
                    mochaOptions: ['--compilers', 'js:babel-register', '---timeout=10000']
                }
            }
        },

        mochaTest: {
            e2e: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    timeout: 10000,
                    clearRequireCache: true,
                },
                src: ['app/test/e2e/**/*.spec.js']
            }
        },

        watch: {
            options: {
                livereload: 35730
            },
            jssrc: {
                files: [
                    'app/src/**/*.js',
                ],
                tasks: ['express:dev'],
                options: {
                    spawn: false
                }
            },
            e2eTest: {
                files: [
                    'app/test/e2e/**/*.spec.js',
                ],
                tasks: ['express:test', 'mochaTest:e2e'],
                options: {
                    spawn: true
                }
            },

        }
    });

    grunt.registerTask('e2eTest', ['mochaTest:e2e']);

    grunt.registerTask('e2eTestCoverage', ['mocha_istanbul:coverage']);

    grunt.registerTask('e2eTest-watch', ['watch:e2eTest']);

    grunt.registerTask('serve', ['express:dev', 'watch']);

    grunt.registerTask('default', 'serve');

};
