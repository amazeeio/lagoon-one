import React from 'react';
import { PageRoute as Route } from '../route';

export default {
  component: Route,
  title: 'Pages/Route',
}

export const Default = () => (
  <Route
    router={{
      query: {
        openshiftProjectName: 'Example'
      },
    }}
  />
);