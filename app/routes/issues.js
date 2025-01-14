/* eslint-disable ember/no-classic-classes */
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  githubIssues: service('github-issues'),

  queryParams: {
    query: {
      refreshModel: true,
    },

    label: {
      refreshModel: true,
    },
  },

  model(params) {
    if (params.query || params.label) {
      return this._filter(params);
    }

    return this._findAllFromCategory(params.category);
  },

  setupController(controller, model) {
    this._super(controller, model);

    controller.queryInput = '';
  },

  _filter(params) {
    let issues = this.store.peekAll('github-issue');
    if (issues.length) {
      if (params.query) {
        issues = issues.filter(this._byTitle(params.query));
      }

      if (params.label) {
        issues = issues.filter(this._matchLabel(params.category, params.label));
      }

      return issues;
    }

    return this._findAllFromCategory(params.category).then((allResults) => {
      if (params.query) {
        allResults = allResults.filter(this._byTitle(params.query));
      }

      if (params.label) {
        allResults = allResults.filter(
          this._matchLabel(params.category, params.label)
        );
      }

      return allResults;
    });
  },

  _findAllFromCategory(category) {
    const GithubIssues = this.githubIssues;
    return GithubIssues.findAllFromCategory(category);
  },

  _byTitle(query) {
    return (issue) => {
      if (!query) {
        return true;
      }
      const issueText = issue.title.toLowerCase();
      const queryText = query.toLowerCase();
      return issueText.includes(queryText);
    };
  },

  _matchLabel(category, label) {
    return (issue) => {
      let inCategory = this._isInCategory(
        category,
        issue.get('repositoryName')
      );
      let included = issue
        .get('labels')
        .map((lb) => lb.name)
        .includes(label);
      return inCategory && included;
    };
  },

  _isInCategory(category, repo) {
    const GithubIssues = this.githubIssues;
    let categoryRepos = GithubIssues.fetchCategoryRepos(category);
    return categoryRepos.isAny('repo', repo);
  },
});
