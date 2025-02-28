import { Matcher, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BackendSrv, locationService, setBackendSrv, setDataSourceSrv } from '@grafana/runtime';
import { configureStore } from 'app/store/configureStore';
import RuleEditor from './RuleEditor';
import { Route, Router } from 'react-router-dom';
import React from 'react';
import { byLabelText, byRole, byTestId, byText } from 'testing-library-selector';
import { selectOptionInTest } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { mockDataSource, MockDataSourceSrv } from './mocks';
import userEvent from '@testing-library/user-event';
import { DataSourceInstanceSettings } from '@grafana/data';
import { getAllDataSources } from './utils/config';
import { fetchRulerRules, fetchRulerRulesGroup, fetchRulerRulesNamespace, setRulerRuleGroup } from './api/ruler';
import { DataSourceType, GRAFANA_RULES_SOURCE_NAME } from './utils/datasource';
import { DashboardSearchHit } from 'app/features/search/types';
import { getDefaultQueries } from './utils/rule-form';
import { ExpressionEditorProps } from './components/rule-editor/ExpressionEditor';
import { GrafanaAlertStateDecision } from 'app/types/unified-alerting-dto';
import { searchFolders } from '../../../../app/features/manage-dashboards/state/actions';

jest.mock('./components/rule-editor/ExpressionEditor', () => ({
  // eslint-disable-next-line react/display-name
  ExpressionEditor: ({ value, onChange }: ExpressionEditorProps) => (
    <input value={value} data-testid="expr" onChange={(e) => onChange(e.target.value)} />
  ),
}));

jest.mock('./api/ruler');
jest.mock('./utils/config');
jest.mock('../../../../app/features/manage-dashboards/state/actions');

// there's no angular scope in test and things go terribly wrong when trying to render the query editor row.
// lets just skip it
jest.mock('app/features/query/components/QueryEditorRow', () => ({
  // eslint-disable-next-line react/display-name
  QueryEditorRow: () => <p>hi</p>,
}));

const mocks = {
  getAllDataSources: jest.mocked(getAllDataSources),
  searchFolders: jest.mocked(searchFolders),
  api: {
    fetchRulerRulesGroup: jest.mocked(fetchRulerRulesGroup),
    setRulerRuleGroup: jest.mocked(setRulerRuleGroup),
    fetchRulerRulesNamespace: jest.mocked(fetchRulerRulesNamespace),
    fetchRulerRules: jest.mocked(fetchRulerRules),
  },
};

function renderRuleEditor(identifier?: string) {
  const store = configureStore();

  locationService.push(identifier ? `/alerting/${identifier}/edit` : `/alerting/new`);

  return render(
    <Provider store={store}>
      <Router history={locationService.getHistory()}>
        <Route path={['/alerting/new', '/alerting/:id/edit']} component={RuleEditor} />
      </Router>
    </Provider>
  );
}

const ui = {
  inputs: {
    name: byLabelText('Rule name'),
    alertType: byTestId('alert-type-picker'),
    dataSource: byTestId('datasource-picker'),
    folder: byTestId('folder-picker'),
    namespace: byTestId('namespace-picker'),
    group: byTestId('group-picker'),
    annotationKey: (idx: number) => byTestId(`annotation-key-${idx}`),
    annotationValue: (idx: number) => byTestId(`annotation-value-${idx}`),
    labelKey: (idx: number) => byTestId(`label-key-${idx}`),
    labelValue: (idx: number) => byTestId(`label-value-${idx}`),
    expr: byTestId('expr'),
  },
  buttons: {
    save: byRole('button', { name: 'Save' }),
    addAnnotation: byRole('button', { name: /Add info/ }),
    addLabel: byRole('button', { name: /Add label/ }),
    // alert type buttons
    grafanaManagedAlert: byRole('button', { name: /Grafana managed/ }),
    lotexAlert: byRole('button', { name: /Cortex or Loki alert/ }),
    lotexRecordingRule: byRole('button', { name: /Cortex or Loki recording rule/ }),
  },
};

describe('RuleEditor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    contextSrv.isEditor = true;
  });

  it('can create a new cloud alert', async () => {
    const dataSources = {
      default: mockDataSource(
        {
          type: 'prometheus',
          name: 'Prom',
          isDefault: true,
        },
        { alerting: true }
      ),
    };

    setDataSourceSrv(new MockDataSourceSrv(dataSources));
    mocks.getAllDataSources.mockReturnValue(Object.values(dataSources));
    mocks.api.setRulerRuleGroup.mockResolvedValue();
    mocks.api.fetchRulerRulesNamespace.mockResolvedValue([]);
    mocks.api.fetchRulerRulesGroup.mockResolvedValue({
      name: 'group2',
      rules: [],
    });
    mocks.api.fetchRulerRules.mockResolvedValue({
      namespace1: [
        {
          name: 'group1',
          rules: [],
        },
      ],
      namespace2: [
        {
          name: 'group2',
          rules: [],
        },
      ],
    });
    mocks.searchFolders.mockResolvedValue([]);

    await renderRuleEditor();
    await waitFor(() => expect(mocks.searchFolders).toHaveBeenCalled());
    await waitFor(() => expect(mocks.api.fetchRulerRulesGroup).toHaveBeenCalled());

    userEvent.type(await ui.inputs.name.find(), 'my great new rule');
    userEvent.click(await ui.buttons.lotexAlert.get());
    const dataSourceSelect = ui.inputs.dataSource.get();
    userEvent.click(byRole('combobox').get(dataSourceSelect));
    await clickSelectOption(dataSourceSelect, 'Prom (default)');
    await waitFor(() => expect(mocks.api.fetchRulerRules).toHaveBeenCalled());
    await clickSelectOption(ui.inputs.namespace.get(), 'namespace2');
    await clickSelectOption(ui.inputs.group.get(), 'group2');

    userEvent.type(ui.inputs.expr.get(), 'up == 1');

    userEvent.type(ui.inputs.annotationValue(0).get(), 'some summary');
    userEvent.type(ui.inputs.annotationValue(1).get(), 'some description');

    // TODO remove skipPointerEventsCheck once https://github.com/jsdom/jsdom/issues/3232 is fixed
    userEvent.click(ui.buttons.addLabel.get(), undefined, { skipPointerEventsCheck: true });

    userEvent.type(ui.inputs.labelKey(0).get(), 'severity');
    userEvent.type(ui.inputs.labelValue(0).get(), 'warn');
    userEvent.type(ui.inputs.labelKey(1).get(), 'team');
    userEvent.type(ui.inputs.labelValue(1).get(), 'the a-team');

    // save and check what was sent to backend
    userEvent.click(ui.buttons.save.get());
    await waitFor(() => expect(mocks.api.setRulerRuleGroup).toHaveBeenCalled());
    expect(mocks.api.setRulerRuleGroup).toHaveBeenCalledWith('Prom', 'namespace2', {
      name: 'group2',
      rules: [
        {
          alert: 'my great new rule',
          annotations: { description: 'some description', summary: 'some summary' },
          labels: { severity: 'warn', team: 'the a-team' },
          expr: 'up == 1',
          for: '1m',
        },
      ],
    });
  });

  it('can create new grafana managed alert', async () => {
    const dataSources = {
      default: mockDataSource(
        {
          type: 'prometheus',
          name: 'Prom',
          isDefault: true,
        },
        { alerting: true }
      ),
    };

    setDataSourceSrv(new MockDataSourceSrv(dataSources));
    mocks.getAllDataSources.mockReturnValue(Object.values(dataSources));
    mocks.api.setRulerRuleGroup.mockResolvedValue();
    mocks.api.fetchRulerRulesNamespace.mockResolvedValue([]);
    mocks.api.fetchRulerRulesGroup.mockResolvedValue({
      name: 'group2',
      rules: [],
    });
    mocks.api.fetchRulerRules.mockResolvedValue({
      namespace1: [
        {
          name: 'group1',
          rules: [],
        },
      ],
      namespace2: [
        {
          name: 'group2',
          rules: [],
        },
      ],
    });
    mocks.searchFolders.mockResolvedValue([
      {
        title: 'Folder A',
        id: 1,
      },
      {
        title: 'Folder B',
        id: 2,
      },
    ] as DashboardSearchHit[]);

    // fill out the form
    await renderRuleEditor();
    await waitFor(() => expect(mocks.searchFolders).toHaveBeenCalled());

    userEvent.type(await ui.inputs.name.find(), 'my great new rule');

    const folderInput = await ui.inputs.folder.find();
    await clickSelectOption(folderInput, 'Folder A');

    userEvent.type(ui.inputs.annotationValue(0).get(), 'some summary');
    userEvent.type(ui.inputs.annotationValue(1).get(), 'some description');

    // TODO remove skipPointerEventsCheck once https://github.com/jsdom/jsdom/issues/3232 is fixed
    userEvent.click(ui.buttons.addLabel.get(), undefined, { skipPointerEventsCheck: true });

    userEvent.type(ui.inputs.labelKey(0).get(), 'severity');
    userEvent.type(ui.inputs.labelValue(0).get(), 'warn');
    userEvent.type(ui.inputs.labelKey(1).get(), 'team');
    userEvent.type(ui.inputs.labelValue(1).get(), 'the a-team');

    // save and check what was sent to backend
    userEvent.click(ui.buttons.save.get());
    await waitFor(() => expect(mocks.api.setRulerRuleGroup).toHaveBeenCalled());
    expect(mocks.api.setRulerRuleGroup).toHaveBeenCalledWith(GRAFANA_RULES_SOURCE_NAME, 'Folder A', {
      interval: '1m',
      name: 'my great new rule',
      rules: [
        {
          annotations: { description: 'some description', summary: 'some summary' },
          labels: { severity: 'warn', team: 'the a-team' },
          for: '5m',
          grafana_alert: {
            condition: 'B',
            data: getDefaultQueries(),
            exec_err_state: 'Alerting',
            no_data_state: 'NoData',
            title: 'my great new rule',
          },
        },
      ],
    });
  });

  it('can create a new cloud recording rule', async () => {
    const dataSources = {
      default: mockDataSource(
        {
          type: 'prometheus',
          name: 'Prom',
          isDefault: true,
        },
        { alerting: true }
      ),
    };

    setDataSourceSrv(new MockDataSourceSrv(dataSources));
    mocks.getAllDataSources.mockReturnValue(Object.values(dataSources));
    mocks.api.setRulerRuleGroup.mockResolvedValue();
    mocks.api.fetchRulerRulesNamespace.mockResolvedValue([]);
    mocks.api.fetchRulerRulesGroup.mockResolvedValue({
      name: 'group2',
      rules: [],
    });
    mocks.api.fetchRulerRules.mockResolvedValue({
      namespace1: [
        {
          name: 'group1',
          rules: [],
        },
      ],
      namespace2: [
        {
          name: 'group2',
          rules: [],
        },
      ],
    });
    mocks.searchFolders.mockResolvedValue([]);

    await renderRuleEditor();
    await waitFor(() => expect(mocks.searchFolders).toHaveBeenCalled());

    userEvent.type(await ui.inputs.name.find(), 'my great new recording rule');
    userEvent.click(await ui.buttons.lotexRecordingRule.get());

    const dataSourceSelect = ui.inputs.dataSource.get();
    userEvent.click(byRole('combobox').get(dataSourceSelect));

    await clickSelectOption(dataSourceSelect, 'Prom (default)');
    await waitFor(() => expect(mocks.api.fetchRulerRules).toHaveBeenCalled());
    await clickSelectOption(ui.inputs.namespace.get(), 'namespace2');
    await clickSelectOption(ui.inputs.group.get(), 'group2');

    userEvent.type(ui.inputs.expr.get(), 'up == 1');

    // TODO remove skipPointerEventsCheck once https://github.com/jsdom/jsdom/issues/3232 is fixed
    userEvent.click(ui.buttons.addLabel.get(), undefined, { skipPointerEventsCheck: true });

    userEvent.type(ui.inputs.labelKey(1).get(), 'team');
    userEvent.type(ui.inputs.labelValue(1).get(), 'the a-team');

    // try to save, find out that recording rule name is invalid
    userEvent.click(ui.buttons.save.get());
    await waitFor(() =>
      expect(
        byText(
          'Recording rule name must be valid metric name. It may only contain letters, numbers, and colons. It may not contain whitespace.'
        ).get()
      ).toBeInTheDocument()
    );
    expect(mocks.api.setRulerRuleGroup).not.toBeCalled();

    // fix name and re-submit
    userEvent.type(await ui.inputs.name.find(), '{selectall}{del}my:great:new:recording:rule');
    userEvent.click(ui.buttons.save.get());

    // save and check what was sent to backend
    userEvent.click(ui.buttons.save.get());
    await waitFor(() => expect(mocks.api.setRulerRuleGroup).toHaveBeenCalled());
    expect(mocks.api.setRulerRuleGroup).toHaveBeenCalledWith('Prom', 'namespace2', {
      name: 'group2',
      rules: [
        {
          record: 'my:great:new:recording:rule',
          labels: { team: 'the a-team' },
          expr: 'up == 1',
        },
      ],
    });
  });

  it('can edit grafana managed rule', async () => {
    const uid = 'FOOBAR123';
    const folder = {
      title: 'Folder A',
      uid: 'abcd',
      id: 1,
    };
    const getFolderByUid = jest.fn().mockResolvedValue({
      ...folder,
      canSave: true,
    });
    const dataSources = {
      default: mockDataSource({
        type: 'prometheus',
        name: 'Prom',
        isDefault: true,
      }),
    };

    const backendSrv = {
      getFolderByUid,
    } as any as BackendSrv;
    setBackendSrv(backendSrv);
    setDataSourceSrv(new MockDataSourceSrv(dataSources));
    mocks.getAllDataSources.mockReturnValue(Object.values(dataSources));
    mocks.api.setRulerRuleGroup.mockResolvedValue();
    mocks.api.fetchRulerRulesNamespace.mockResolvedValue([]);
    mocks.api.fetchRulerRules.mockResolvedValue({
      [folder.title]: [
        {
          interval: '1m',
          name: 'my great new rule',
          rules: [
            {
              annotations: { description: 'some description', summary: 'some summary' },
              labels: { severity: 'warn', team: 'the a-team' },
              for: '5m',
              grafana_alert: {
                uid,
                namespace_uid: 'abcd',
                namespace_id: 1,
                condition: 'B',
                data: getDefaultQueries(),
                exec_err_state: GrafanaAlertStateDecision.Alerting,
                no_data_state: GrafanaAlertStateDecision.NoData,
                title: 'my great new rule',
              },
            },
          ],
        },
      ],
    });
    mocks.searchFolders.mockResolvedValue([folder] as DashboardSearchHit[]);

    await renderRuleEditor(uid);
    await waitFor(() => expect(mocks.searchFolders).toHaveBeenCalled());

    // check that it's filled in
    const nameInput = await ui.inputs.name.find();
    expect(nameInput).toHaveValue('my great new rule');
    expect(ui.inputs.folder.get()).toHaveTextContent(new RegExp(folder.title));
    expect(ui.inputs.annotationValue(0).get()).toHaveValue('some description');
    expect(ui.inputs.annotationValue(1).get()).toHaveValue('some summary');

    // add an annotation
    await clickSelectOption(ui.inputs.annotationKey(2).get(), /Add new/);
    userEvent.type(byRole('textbox').get(ui.inputs.annotationKey(2).get()), 'custom');
    userEvent.type(ui.inputs.annotationValue(2).get(), 'value');

    //add a label
    userEvent.type(ui.inputs.labelKey(2).get(), 'custom');
    userEvent.type(ui.inputs.labelValue(2).get(), 'value');

    // save and check what was sent to backend
    userEvent.click(ui.buttons.save.get());
    await waitFor(() => expect(mocks.api.setRulerRuleGroup).toHaveBeenCalled());

    expect(mocks.api.setRulerRuleGroup).toHaveBeenCalledWith(GRAFANA_RULES_SOURCE_NAME, 'Folder A', {
      interval: '1m',
      name: 'my great new rule',
      rules: [
        {
          annotations: { description: 'some description', summary: 'some summary', custom: 'value' },
          labels: { severity: 'warn', team: 'the a-team', custom: 'value' },
          for: '5m',
          grafana_alert: {
            uid,
            condition: 'B',
            data: getDefaultQueries(),
            exec_err_state: 'Alerting',
            no_data_state: 'NoData',
            title: 'my great new rule',
          },
        },
      ],
    });
  });

  it('for cloud alerts, should only allow to select editable rules sources', async () => {
    const dataSources: Record<string, DataSourceInstanceSettings<any>> = {
      // can edit rules
      loki: mockDataSource(
        {
          type: DataSourceType.Loki,
          name: 'loki with ruler',
        },
        { alerting: true }
      ),
      loki_disabled: mockDataSource(
        {
          type: DataSourceType.Loki,
          name: 'loki disabled for alerting',
          jsonData: {
            manageAlerts: false,
          },
        },
        { alerting: true }
      ),
      // can edit rules
      prom: mockDataSource(
        {
          type: DataSourceType.Prometheus,
          name: 'cortex with ruler',
        },
        { alerting: true }
      ),
      // cannot edit rules
      loki_local_rule_store: mockDataSource(
        {
          type: DataSourceType.Loki,
          name: 'loki with local rule store',
        },
        { alerting: true }
      ),
      // cannot edit rules
      prom_no_ruler_api: mockDataSource(
        {
          type: DataSourceType.Loki,
          name: 'cortex without ruler api',
        },
        { alerting: true }
      ),
      // not a supported datasource type
      splunk: mockDataSource(
        {
          type: 'splunk',
          name: 'splunk',
        },
        { alerting: true }
      ),
    };

    mocks.api.fetchRulerRulesGroup.mockImplementation(async (dataSourceName: string) => {
      if (dataSourceName === 'loki with ruler' || dataSourceName === 'cortex with ruler') {
        return null;
      }
      if (dataSourceName === 'loki with local rule store') {
        throw {
          status: 400,
          data: {
            message: 'GetRuleGroup unsupported in rule local store',
          },
        };
      }
      if (dataSourceName === 'cortex without ruler api') {
        throw new Error('404 from rules config endpoint. Perhaps ruler API is not enabled?');
      }
      return null;
    });

    setDataSourceSrv(new MockDataSourceSrv(dataSources));
    mocks.getAllDataSources.mockReturnValue(Object.values(dataSources));
    mocks.searchFolders.mockResolvedValue([]);

    // render rule editor, select cortex/loki managed alerts
    await renderRuleEditor();
    await waitFor(() => expect(mocks.searchFolders).toHaveBeenCalled());

    await ui.inputs.name.find();
    userEvent.click(await ui.buttons.lotexAlert.get());

    // wait for ui theck each datasource if it supports rule editing
    await waitFor(() => expect(mocks.api.fetchRulerRulesGroup).toHaveBeenCalledTimes(4));

    // check that only rules sources that have ruler available are there
    const dataSourceSelect = ui.inputs.dataSource.get();
    userEvent.click(byRole('combobox').get(dataSourceSelect));
    expect(await byText('loki with ruler').query()).toBeInTheDocument();
    expect(byText('cortex with ruler').query()).toBeInTheDocument();
    expect(byText('loki with local rule store').query()).not.toBeInTheDocument();
    expect(byText('prom without ruler api').query()).not.toBeInTheDocument();
    expect(byText('splunk').query()).not.toBeInTheDocument();
    expect(byText('loki disabled for alerting').query()).not.toBeInTheDocument();
  });
});

const clickSelectOption = async (selectElement: HTMLElement, optionText: Matcher): Promise<void> => {
  userEvent.click(byRole('combobox').get(selectElement));
  await selectOptionInTest(selectElement, optionText as string);
};
