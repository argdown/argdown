#!/usr/bin/env sh

# abort on errors
set -e

# build
yarn run build

# navigate into the build output directory
cd docs/.vuepress/dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy docs website'

# if you are deploying to https://<USERNAME>.github.io
# git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git master

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# ToDo update username once code migration is done
git push -f https://github.com/argdown/argdown.git main:gh-pages

cd -

# The current script works, but it can be improved to align with modern practices and make it more robust. Here are some suggestions to improve the deployment process for GitHub Pages:
# 
# Suggested Improvements
# Use the gh-pages npm package: Instead of manually initializing a Git repository and pushing to the gh-pages branch, you can use the gh-pages npm package. It simplifies the process and handles the deployment for you.
# 
# Avoid hardcoding repository URLs: Use environment variables or dynamically fetch the repository URL to make the script reusable across different projects.
# 
# Ensure the correct branch is used: Modern repositories often use main as the default branch, so ensure the script reflects this.
# 
# Add error handling: While set -e stops the script on errors, you can add more specific error messages for better debugging.
# 
# Updated Script Using gh-pages Package
# Here’s how you can rewrite the script to use the gh-pages package:
# 
# ```
# #!/usr/bin/env sh
# 
# # abort on errors
# set -e
# 
# # build the project
# yarn run build
# 
# # deploy to GitHub Pages using gh-pages
# npx gh-pages -d docs/.vuepress/dist -r https://github.com/argdown/argdown.git
# 
# echo "Deployment to GitHub Pages completed successfully!"
# ```
# 
# Key Changes:
# gh-pages Package:
# 
# The gh-pages package automatically handles the Git initialization, commit, and push to the gh-pages branch.
# The -d flag specifies the directory to deploy (docs/.vuepress/dist in this case).
# The -r flag specifies the repository URL.
# Simplified Script:
# 
# The script is shorter and easier to maintain since gh-pages handles most of the complexity.
# Error Handling:
# 
# The set -e ensures the script stops on errors, and the echo statement confirms successful deployment.
# Installation:
# To use the gh-pages package, install it as a development dependency:
# 
# ```sh
# yarn add gh-pages --dev
# ```
# 
# Why This is Better:
# Less Manual Work: No need to manually initialize a Git repository or manage branches.
# Reusable: The script can be reused across projects with minimal changes.
# Community-Recommended: The gh-pages package is widely used and maintained.
# If you prefer to stick with the manual approach, ensure you explicitly create and push to the gh-pages branch, as shown in the earlier response.