import React from 'react';
import Head from 'next/head';

export interface LayoutProps {
  children: React.ReactNode;
  id?: string;
}

export default function Layout(props: LayoutProps): JSX.Element {
  return (
    <>
      <Head>
        <title>C2A Graph Visualizer</title>
      </Head>
      <main id={props.id}>
        {props.children}
      </main>
    </>
  );
}