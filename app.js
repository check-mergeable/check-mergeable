module.exports = (app) => {
  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize',
  ], async (context) => {
    const octokit = context.octokit
    const logger = app.log
    logger.info(`Got an event '${context.name}' from '${context.payload.repository.owner.login}/${context.payload.repository.name}'.`)

    const repository = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
    }
    const pullRequest = context.payload.pull_request
    const isMergeable = getMergeable({ logger, pullRequest })

    await Promise.all([
      updateStatus({ octokit, logger, repository, pullRequest, isMergeable }),
      updateLabel({ octokit, logger, repository, pullRequest, isMergeable }),
    ])
  })
}

const getMergeable = ({ logger, pullRequest }) => {
  const targetBranch = pullRequest.base.ref
  const labels = pullRequest.labels
  logger.info(`Target branch is ${targetBranch}.`)

  const isAllowedTargetBranch = (
    targetBranch === 'main' ||
    targetBranch === 'develop' ||
    targetBranch.startsWith('release/') ||
    targetBranch.startsWith('hotfix/')
  )
  const isMergeable = (
    isAllowedTargetBranch &&
    !labels.includes('status: pending') &&
    !labels.includes('status: in-progress') &&
    labels.findIndex(label => label.startsWith('status: in-review')) === -1
  )
  logger.info(`This pull request is ${isMergeable ? '' : 'not '}mergeable.`)

  return isMergeable
}

const updateStatus = async ({ octokit, logger, repository, pullRequest, isMergeable }) => {
  const state = isMergeable ? 'success' : 'pending'
  logger.info(`Updating status to '${state}'.`)

  try {
    await octokit.request('POST /repos/:owner/:repo/statuses/:sha', {
      ...repository,
      sha: pullRequest.head.sha,
      context: 'Can I merge this PR?',
      description: isMergeable ? 'Let\'s go!' : 'Wait...',
      state,
    })
    logger.info(`Updated status.`)
  } catch (error) {
    logger.error(`Failed to update status. ${error}`)
  }
}

const updateLabel = async ({ isMergeable, ...params }) => {
  const label = 'status: dependent'
  if (!isMergeable) {
    await addLabel({ ...params, label })
  } else {
    await removeLabel({ ...params, label })
  }
}

const addLabel = async ({ octokit, logger, repository, pullRequest, label }) => {
  logger.info(`Adding label '${label}'.`)

  const exists = pullRequest.labels.find(x => x.name === label)
  if (exists) {
    logger.info(`Label '${label}' already exists. Skip.`)
    return
  }

  try {
    await octokit.issues.addLabels({
      ...repository,
      issue_number: pullRequest.number,
      labels: [label],
    })
    logger.info(`Added label.`)
  } catch (error) {
    logger.error(`Failed to add label. ${error}`)
  }
}

const removeLabel = async ({ octokit, logger, repository, pullRequest, label }) => {
  logger.info(`Removing label '${label}'.`)
  try {
    await octokit.issues.removeLabel({
      ...repository,
      issue_number: pullRequest.number,
      name: label,
    })
    logger.info(`Removed label.`)
  } catch (error) {
    logger.error(`Failed to remove label. ${error}`)
  }
}
