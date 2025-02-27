import { subject } from '@casl/ability';
import {
    Badge,
    Button,
    Flex,
    Group,
    ScrollArea,
    Stack,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconPlayerPlay, IconRefresh, IconTrashX } from '@tabler/icons-react';
import React, { useCallback, useMemo, useState } from 'react';
import { TimeGranularity } from '../api/MetricFlowAPI';
import { ChartDownloadMenu } from '../components/ChartDownload';
import CollapsableCard from '../components/common/CollapsableCard';
import LoadingState from '../components/common/LoadingState';
import Page from '../components/common/Page/Page';
import PageBreadcrumbs from '../components/common/PageBreadcrumbs';
import VisualizationConfigPanel from '../components/Explorer/VisualizationCard/VisualizationConfigPanel';
import VisualizationCardOptions from '../components/Explorer/VisualizationCardOptions';
import ForbiddenPanel from '../components/ForbiddenPanel';
import LightdashVisualization from '../components/LightdashVisualization';
import VisualizationProvider from '../components/LightdashVisualization/VisualizationProvider';
import MetricFlowFieldList from '../features/metricFlow/components/MetricFlowFieldList';
import MetricFlowSqlCard from '../features/metricFlow/components/MetricFlowSqlCard';
import MetricFlowResultsTable from '../features/metricFlow/components/ResultsTable';
import useMetricFlowFields from '../features/metricFlow/hooks/useMetricFlowFields';
import useMetricFlowQueryResults from '../features/metricFlow/hooks/useMetricFlowQueryResults';
import useMetricFlowVisualization from '../features/metricFlow/hooks/useMetricFlowVisualization';
import convertFieldMapToTableColumns from '../features/metricFlow/utils/convertFieldMapToTableColumns';
import convertMetricFlowFieldsToExplore from '../features/metricFlow/utils/convertMetricFlowFieldsToExplore';
import convertMetricFlowQueryResultsToResultsData from '../features/metricFlow/utils/convertMetricFlowQueryResultsToResultsData';
import useToaster from '../hooks/toaster/useToaster';
import { useActiveProjectUuid } from '../hooks/useActiveProject';
import { useApp } from '../providers/AppProvider';

const MOCK_TABLE_NAME = 'metricflow';

const MetricFlowPage = () => {
    const { showToastError } = useToaster();
    const { user } = useApp();
    const { activeProjectUuid } = useActiveProjectUuid();
    const [selectedMetrics, setSelectedMetrics] = useState<Record<string, {}>>(
        {},
    );
    const [selectedDimensions, setSelectedDimensions] = useState<
        Record<string, { grain: TimeGranularity }>
    >({});
    const metricFlowFieldsQuery = useMetricFlowFields(
        activeProjectUuid,
        {
            metrics: selectedMetrics,
            dimensions: selectedDimensions,
        },
        {
            onError: (err) => {
                showToastError({
                    title: 'Error fetching metrics and dimensions',
                    subtitle: err.error.message,
                });
                setSelectedMetrics({});
                setSelectedDimensions({});
            },
        },
    );
    const metricFlowQueryResultsQuery = useMetricFlowQueryResults(
        activeProjectUuid,
        {
            metrics: selectedMetrics,
            dimensions: selectedDimensions,
        },
        {
            onError: (err) => {
                showToastError({
                    title: 'Error generating query',
                    subtitle: err.error.message,
                });
            },
        },
        {
            onError: (err) => {
                showToastError({
                    title: 'Error fetching results',
                    subtitle: err.error.message,
                });
            },
        },
    );

    const explore = useMemo(() => {
        if (!metricFlowFieldsQuery.data) {
            return undefined;
        }

        return convertMetricFlowFieldsToExplore(
            MOCK_TABLE_NAME,
            metricFlowFieldsQuery.data,
        );
    }, [metricFlowFieldsQuery.data]);

    const { resultsData, columns } = useMemo(() => {
        if (!explore || !metricFlowQueryResultsQuery.data?.query.jsonResult) {
            return { resultsData: undefined, columns: [] };
        }

        const results = convertMetricFlowQueryResultsToResultsData(
            explore,
            metricFlowQueryResultsQuery.data.query.jsonResult,
        );
        return {
            resultsData: results.resultsData,
            columns: convertFieldMapToTableColumns(results.fieldsMap),
        };
    }, [explore, metricFlowQueryResultsQuery.data]);
    const {
        chartType,
        columnOrder,
        chartConfig,
        setChartType,
        setChartConfig,
        setPivotFields,
    } = useMetricFlowVisualization(resultsData);

    const handleMetricSelect = useCallback(
        (metric: string) => {
            setSelectedMetrics((prevState) => {
                if (!!prevState[metric]) {
                    delete prevState[metric];
                } else {
                    prevState[metric] = { grain: TimeGranularity.DAY };
                }
                return { ...prevState };
            });
        },
        [setSelectedMetrics],
    );

    const handleDimensionSelect = useCallback(
        (dimension: string) => {
            setSelectedDimensions((prevState) => {
                if (!!prevState[dimension]) {
                    delete prevState[dimension];
                } else {
                    prevState[dimension] = { grain: TimeGranularity.DAY };
                }
                return { ...prevState };
            });
        },
        [setSelectedDimensions],
    );

    const handleDimensionTimeGranularitySelect = useCallback(
        (dimension: string, timeGranularity: TimeGranularity) => {
            setSelectedDimensions((prevState) => {
                prevState[dimension] = { grain: timeGranularity };
                return { ...prevState };
            });
        },
        [setSelectedDimensions],
    );

    const cannotViewProject = user.data?.ability?.cannot(
        'view',
        subject('Project', {
            organizationUuid: user.data.organizationUuid,
            projectUuid: activeProjectUuid,
        }),
    );

    if (user.isLoading || !activeProjectUuid) {
        return <LoadingState title="Loading metricflow" />;
    }
    if (cannotViewProject) {
        return <ForbiddenPanel />;
    }
    return (
        <Page
            title="MetricFlow"
            withSidebarFooter
            withFullHeight
            withPaddedContent
            sidebar={
                <Stack
                    spacing="xl"
                    mah="100%"
                    sx={{ overflowY: 'hidden', flex: 1 }}
                >
                    <Group position="apart">
                        <Flex gap="xs">
                            <PageBreadcrumbs
                                items={[
                                    {
                                        title: 'dbt Semantic Layer',
                                        active: true,
                                    },
                                ]}
                            />
                            <Tooltip
                                multiline
                                label={`The dbt Semantic Layer integration is in beta and may be unstable`}
                            >
                                <Badge size="sm" variant="light">
                                    BETA
                                </Badge>
                            </Tooltip>
                        </Flex>
                        <Button.Group>
                            <Tooltip
                                label={'Run query'}
                                withinPortal
                                position="bottom"
                            >
                                <Button
                                    size="xs"
                                    variant="default"
                                    disabled={
                                        metricFlowQueryResultsQuery.isLoading
                                    }
                                    onClick={() =>
                                        metricFlowQueryResultsQuery.refetch()
                                    }
                                >
                                    <IconPlayerPlay size={12} color="blue" />
                                </Button>
                            </Tooltip>
                            <Tooltip
                                label={'Refetch fields'}
                                withinPortal
                                position="bottom"
                            >
                                <Button
                                    size="xs"
                                    variant="default"
                                    disabled={metricFlowFieldsQuery.isFetching}
                                    onClick={() =>
                                        metricFlowFieldsQuery.refetch()
                                    }
                                >
                                    <IconRefresh size={12} />
                                </Button>
                            </Tooltip>
                            <Tooltip
                                label={'Clear selected fields'}
                                withinPortal
                                position="bottom"
                            >
                                <Button
                                    size="xs"
                                    variant="default"
                                    onClick={() => {
                                        setSelectedMetrics({});
                                        setSelectedDimensions({});
                                    }}
                                >
                                    <IconTrashX size={12} color="red" />
                                </Button>
                            </Tooltip>
                        </Button.Group>
                    </Group>
                    <Stack mah="100%" sx={{ overflow: 'hidden' }}>
                        <Flex align="baseline" gap="xxs">
                            <Title order={5} color="yellow.9">
                                Metrics
                            </Title>
                            <Text span fz="xs" color="gray.6">
                                (
                                {metricFlowFieldsQuery.data
                                    ?.metricsForDimensions.length ?? 0}
                                {Object.keys(selectedDimensions).length > 0 && (
                                    <> available based on selected dimensions</>
                                )}
                                )
                            </Text>
                        </Flex>
                        <ScrollArea offsetScrollbars sx={{ flex: 1 }}>
                            <MetricFlowFieldList
                                fields={
                                    metricFlowFieldsQuery.data
                                        ?.metricsForDimensions
                                }
                                selectedFields={selectedMetrics}
                                onClick={(name) => handleMetricSelect(name)}
                            />
                        </ScrollArea>
                        <Flex align="baseline" gap="xxs">
                            <Title order={5} color="blue.9">
                                Dimensions
                            </Title>
                            <Text span fz="xs" color="gray.6">
                                (
                                {metricFlowFieldsQuery.data?.dimensions
                                    .length ?? 0}
                                {selectedMetrics.size > 0 && (
                                    <> available based on selected metrics</>
                                )}
                                )
                            </Text>
                        </Flex>
                        <ScrollArea offsetScrollbars sx={{ flex: 1 }}>
                            <MetricFlowFieldList
                                fields={metricFlowFieldsQuery.data?.dimensions}
                                selectedFields={selectedDimensions}
                                onClick={(name) => handleDimensionSelect(name)}
                                onClickTimeGranularity={
                                    handleDimensionTimeGranularitySelect
                                }
                            />
                        </ScrollArea>
                    </Stack>
                </Stack>
            }
        >
            <Stack spacing="sm" sx={{ flexGrow: 1 }}>
                <VisualizationProvider
                    initialChartConfig={chartConfig}
                    initialPivotDimensions={undefined}
                    chartType={chartType}
                    resultsData={resultsData}
                    isLoading={metricFlowQueryResultsQuery.isLoading}
                    onChartConfigChange={setChartConfig}
                    onChartTypeChange={setChartType}
                    onPivotDimensionsChange={setPivotFields}
                    columnOrder={columnOrder}
                    explore={explore}
                    isSqlRunner={true}
                >
                    <CollapsableCard
                        title="Charts"
                        rightHeaderElement={
                            <>
                                <VisualizationCardOptions />
                                <VisualizationConfigPanel
                                    chartType={chartType}
                                />
                                {activeProjectUuid && (
                                    <ChartDownloadMenu
                                        projectUuid={activeProjectUuid}
                                    />
                                )}
                            </>
                        }
                        isOpen={true}
                        shouldExpand
                        onToggle={() => undefined}
                    >
                        <LightdashVisualization className="sentry-block ph-no-capture" />
                    </CollapsableCard>
                </VisualizationProvider>

                <CollapsableCard
                    title="Results"
                    isOpen={true}
                    onToggle={() => undefined}
                >
                    <MetricFlowResultsTable
                        columns={columns}
                        resultsData={resultsData}
                        status={metricFlowQueryResultsQuery.status}
                        error={metricFlowQueryResultsQuery.error}
                    />
                </CollapsableCard>
                <MetricFlowSqlCard
                    projectUuid={activeProjectUuid}
                    status={metricFlowQueryResultsQuery.status}
                    sql={metricFlowQueryResultsQuery.data?.query.sql}
                    error={metricFlowQueryResultsQuery.error}
                    canRedirectToSqlRunner={user.data?.ability?.can(
                        'manage',
                        subject('SqlRunner', {
                            organizationUuid: user.data?.organizationUuid,
                            projectUuid: activeProjectUuid,
                        }),
                    )}
                />
            </Stack>
        </Page>
    );
};
export default MetricFlowPage;
