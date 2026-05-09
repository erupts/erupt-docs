# 贡献指南

这篇指南会指导你如何为 erupt 贡献一份自己的力量，请在你要提 **issue** 或者 **pull request** 之前花几分钟来阅读一遍这篇指南。

## 行为准则

我们有一份 [行为准则](https://github.com/erupts/erupt/blob/master/CODE_OF_CONDUCT.md)，希望所有的贡献者都能遵守，请花时间阅读一遍全文以确保你能明白哪些是可以做的，哪些是不可以做的。

## 透明的开发

我们所有的工作都会放在 [GitHub](https://github.com/erupts/erupt) 上。不管是核心团队的成员还是外部贡献者的 pull request 都需要经过同样流程的 review。

## Bugs

我们使用 [GitHub Issues](https://github.com/erupts/erupt/issues) 来做 bug 追踪。

在你报告一个 bug 之前，请先确保已经搜索过已有的 issue 和阅读了我们的 [常见问题](/guide/faq)。

## 第一次贡献

如果你还不清楚怎么在 GitHub 上提 Pull Request，可以阅读下面这些文章来学习：

- [如何为开源做贡献](https://opensource.guide/zh-cn/how-to-contribute/)
- [第一次参与开源](https://github.com/firstcontributions/first-contributions/blob/master/translations/README.chs.md)

## 贡献代码

Erupt 团队会关注所有的 Pull Request，我们会 review 以及合并你的代码，也有可能要求你做一些修改或者告诉你我们为什么不能接受这样的修改。

## 如何提出 Pull Request

1. fork `erupt` 仓库，以下所有操作均在 fork 之后的仓库上执行
2. 在 `master` 分支运行：`git remote add upstream https://github.com/erupts/erupt`
3. 在 `master` 分支运行：`git pull upstream master`
4. 在 `master` 分支运行：`git push origin master`
5. 切换到你要工作的 feature 分支（例如有一个分支叫 `docs-fix`）：`git checkout docs-fix`
6. 在 `docs-fix` 分支运行：`git rebase origin/master`
7. 在 `docs-fix` 分支修改代码，并 commit：`git commit -a`
8. 推送代码 `git push`（可能需要 `-f`）
9. 在 Github 上发起 Pull Request 请求
