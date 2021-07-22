// @flow

import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/src/logs';
import { createMiscTask } from '@lagoon/commons/src/tasks';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Sql } from './sql';
import validator from 'validator';
import {ResolverFn} from "../index";
import {Helpers} from "../task/helpers";
import {pubSub} from "../../clients/pubSub";
import EVENTS from "../task/events";

/* ::

import type {ResolversObj} from '../';

*/

export const getFactsByEnvironmentId = async (
  { id: environmentId },
  {severity},
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'view', {
    project: environment.project,
  });

  const rows = await query(
    sqlClient,
    Sql.selectFactsByEnvironmentId({
      environmentId,
    }),
  );

  return  R.sort(R.descend(R.prop('created')), rows);
};

export const addFact = async (
  root,
  {
    input: {
      id, environment: environmentId, name, value, source, description
    },
  },
  { sqlClient, hasPermission },
) => {

  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'add', {
    project: environment.project,
  });

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertFact({
      environment: environmentId,
      name,
      value,
      source,
      description
    }),
  );

  const rows = await query(sqlClient, Sql.selectFactByDatabaseId(insertId));
  return R.prop(0, rows);
};

export const addFacts = async (
  root,
  {
    input: {
      facts
    }
  },
  { sqlClient, hasPermission }
) => {

  const environments = facts.reduce((environmentList, fact) => {
    let { environment } = fact;
    if (!environmentList.includes(environment)) {
      environmentList.push(environment);
    }
    return environmentList;
  }, []);

  for (let i = 0; i < environments.length; i++) {
    const env = await environmentHelpers(sqlClient).getEnvironmentById(
      environments[i]
    );
    await hasPermission('fact', 'add', {
      project: env.project
    });
  }

  const returnFacts = [];
  for (let i = 0; i < facts.length; i++) {
    const { environment, name, value, source, description } = facts[i];
    const {
      info: { insertId }
    } = await query(
      sqlClient,
      Sql.insertFact({
        environment,
        name,
        value,
        source,
        description
      })
    );

    const rows = await query(sqlClient, Sql.selectFactByDatabaseId(insertId));
    returnFacts.push(R.prop(0, rows));
  }

  return returnFacts;
};

export const deleteFact = async (
  root,
  {
    input : {
      environment: environmentId,
      name,
    }
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFact(environmentId, name));

  return 'success';
};

export const deleteFactsFromSource = async (
  root,
  {
    input : {
     environment: environmentId,
     source,
    }
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFactsFromSource(environmentId, source));

  return 'success';
};
