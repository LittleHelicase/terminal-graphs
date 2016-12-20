
var yargs = require('yargs')
var termGraphs = require('./index')
var cliExt = require('cli-ext')

var argv = yargs
  .option('dot', {
    alias: 'd',
    describe: 'Interpret input as dot file (only rudimentary support)'
  })
  .argv


cliExt.input(argv._[0])
.then((input) => {
  if (argv.dot) {
    return termGraphs.renderDot(input)
  } else {
    return termGraphs.render(input)
  }
  // termGraphs('digraph G {\n bdddd -> z; \n adadadad -> bdddd; \n r -> bdddd; \n abababa -> bdddd; \n bdddd -> casdasds; \n}')
})
.then((graph) => console.log(graph))
.catch((err) => console.error(err))
