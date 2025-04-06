import vfile from "to-vfile";
import argdown from "@argdown/remark-plugin";

export default ({ markdownAST, markdownNode }, options) => {
  const file = vfile(markdownNode.fileAbsolutePath);

  return argdown(options)(markdownAST, file);
};
