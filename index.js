module.exports = (app) => {
  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize',
  ], (context) => {
    const octokit = context.octokit
    const logger = app.log
    logger.info(`Got an event: ${context.name}.`)

    const repository = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
    }
    const pullRequest = context.payload.pull_request
    const isMergeable = getMergeable({ logger, pullRequest })

    updateStatus({ octokit, logger, repository, pullRequest, isMergeable })
    updateLabel({ octokit, logger, repository, pullRequest, isMergeable })
  })
}

const getMergeable = ({ logger, pullRequest }) => {
  const targetBranch = pullRequest.base.ref
  logger.info(`Target branch is ${targetBranch}.`)

  const isMergeable = (
    targetBranch === 'main' ||
    targetBranch.startsWith('release/') ||
    targetBranch.startsWith('hotfix/')
  )
  logger.info(`This pull request is ${isMergeable ? '' : 'not '}mergeable.`)

  return isMergeable
}

const updateStatus = ({ octokit, logger, repository, pullRequest, isMergeable }) => {
  logger.info(`Updating status.`)
  octokit
    .request('POST /repos/:owner/:repo/statuses/:sha', {
      ...repository,
      sha: pullRequest.head.sha,
      target_url: `https://github.com/${repository.owner}/${repository.repo}`,
      context: 'Can I merge this PR?',
      description: isMergeable ? 'Let\'s go!' : 'Wait...',
      state: isMergeable ? 'success' : 'pending',
    })
    .then(() => logger.info(`Updated status.`))
    .catch(error => logger.error(`Failed to update status. ${error}`))
}

const updateLabel = ({ isMergeable, ...params }) => {
  const label = 'status: dependent'
  if (!isMergeable) {
    addLabel({ ...params, label })
  } else {
    removeLabel({ ...params, label })
  }
}

const addLabel = ({ octokit, logger, repository, pullRequest, label }) => {
  logger.info(`Adding label.`)

  const exists = pullRequest.labels.find(x => x.name === label)
  if (exists) {
    logger.info('Label already exists. Skip.')
    return
  }

  octokit.issues
    .addLabels({
      ...repository,
      issue_number: pullRequest.number,
      labels: [label],
    })
    .then(() => logger.info(`Added label.`))
    .catch(error => logger.error(`Failed to add label. ${error}`))
}

const removeLabel = ({ octokit, logger, repository, pullRequest, label }) => {
  logger.info(`Removing label.`)

  octokit.issues
    .removeLabel({
      ...repository,
      issue_number: pullRequest.number,
      name: label,
    })
    .then(() => logger.info(`Removed label.`))
    .catch(error => logger.error(`Failed to remove label. ${error}`))
}
