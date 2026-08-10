'use client';

import React from 'react';

import SQLEditor from '@/components/SQLEditor';
import SQLExplorer from '@/components/SQLExplorer';

export default function EditorPage(): React.JSX.Element {
  return (
    <div className="grid md:grid-cols-12 items-start">
      <div className="col-span-9">
        <SQLEditor />
      </div>
      <div className="col-span-3 card">
        <h2>Tables</h2>
        <SQLExplorer />
      </div>
    </div>
  );
}
