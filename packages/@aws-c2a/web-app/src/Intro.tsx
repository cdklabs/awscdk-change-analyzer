import { Steps } from 'intro.js-react';
import React from 'react';

export const Intro = () => {
  const steps = [
    {
      intro: 'Welcome to the CDK Change Analysis Tool. Here\'s a quick UI introduction',
    },
    {
      element: '#all-changes-tab',
      intro: "You are currently in the 'All Changes' tab, which lists and groups all the changes",
      position: 'bottom',
    },
    {
      element: '#aggs-tree-container > *',
      intro: 'These are the detected High Risk changes. You can expand items in this tree and select them to view their details on the right pane',
    },
    {
      element: '#aggs-tree-container > *:not(:first-child)',
      intro: 'There are also Unclassified and Low Risk changes you can review in the same way',
    },
    {
      element: '#aggs-tree-container button[title="Approve these changes"]',
      intro: 'For every change/group of changes, you can mark it as approved\n\n(some are already pre-approved by the tool based on customizable rules)',
    },
    {
      element: '#hierarchical-view-tab',
      intro: 'Finally, in the Hierarchical tab you can also navigate the CDK constructs and view their children and changes',
    },
    {
      intro: 'You can now close this modal and get to reviewing. Good luck!',
    },
  ];

  return <Steps
    enabled={true}
    steps={steps}
    initialStep={0}
  />;
};