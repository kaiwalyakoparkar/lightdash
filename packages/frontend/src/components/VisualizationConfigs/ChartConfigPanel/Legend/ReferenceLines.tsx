import {
    CompiledDimension,
    Field,
    fieldId as getFieldId,
    isField,
    Series,
    TableCalculation,
} from '@lightdash/common';
import { FC, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useProject } from '../../../../hooks/useProject';
import MantineIcon from '../../../common/MantineIcon';
import { ReferenceLineField } from '../../../common/ReferenceLine';
import { useVisualizationContext } from '../../../LightdashVisualization/VisualizationProvider';
import { ReferenceLine } from './ReferenceLine';

type Props = {
    items: (Field | TableCalculation | CompiledDimension)[];
    projectUuid: string;
};

export const ReferenceLines: FC<Props> = ({ items, projectUuid }) => {
    const {
        cartesianConfig: {
            dirtyLayout,
            dirtyEchartsConfig,
            updateSeries,
            referenceLines,
            setReferenceLines,
        },
    } = useVisualizationContext();

    const project = useProject(projectUuid);
    const startOfWeek = useMemo(
        () => project.data?.warehouseConnection?.startOfWeek,
        [project],
    );
    const updateReferenceLine = useCallback(
        (
            updateValue: string,
            updateField: Field | TableCalculation | CompiledDimension,
            updateLabel: string | undefined,
            updateColor: string,
            lineId: string,
        ) => {
            if (updateValue && updateField) {
                const fieldId = isField(updateField)
                    ? getFieldId(updateField)
                    : updateField.name;

                if (dirtyEchartsConfig?.series) {
                    const selectedSeries = dirtyEchartsConfig?.series.find(
                        (serie: Series) =>
                            (dirtyLayout?.xField === fieldId
                                ? serie.encode.xRef
                                : serie.encode.yRef
                            ).field === fieldId,
                    );
                    if (selectedSeries === undefined) return;

                    const dataWithAxis = {
                        name: updateLabel || 'Reference line',
                        value: lineId,
                        lineStyle: { color: updateColor },
                        label: updateLabel ? { formatter: updateLabel } : {},
                        xAxis: undefined,
                        yAxis: undefined,
                        [dirtyLayout?.xField === fieldId ? 'xAxis' : 'yAxis']:
                            updateValue,
                    };

                    const updatedReferenceLines: ReferenceLineField[] =
                        referenceLines.map((line) => {
                            // Check both .value and .name for backwards compatibility
                            if (
                                line.data.value === lineId ||
                                line.data.name === lineId
                            )
                                return { fieldId: fieldId, data: dataWithAxis };
                            else return line;
                        });

                    setReferenceLines(updatedReferenceLines);
                }
            }
        },
        [
            setReferenceLines,
            dirtyEchartsConfig?.series,
            dirtyLayout?.xField,
            referenceLines,
        ],
    );

    const addReferenceLine = useCallback(() => {
        const newReferenceLine: ReferenceLineField = {
            data: {
                name: 'Reference line',
                value: uuidv4(),
            },
        };
        setReferenceLines([...referenceLines, newReferenceLine]);
    }, [referenceLines, setReferenceLines]);

    const removeReferenceLine = useCallback(
        (markLineId) => {
            if (!dirtyEchartsConfig?.series) return;
            const series = dirtyEchartsConfig?.series.map((serie) => {
                return {
                    ...serie,
                    markLine: {
                        ...serie.markLine,
                        data:
                            serie.markLine?.data.filter(
                                (data) =>
                                    data.value !== markLineId &&
                                    data.name !== markLineId,
                            ) || [],
                    },
                };
            });

            updateSeries(series);

            setReferenceLines(
                referenceLines.filter(
                    (line) =>
                        line.data.value !== markLineId &&
                        line.data.name !== markLineId,
                ),
            );
        },
        [
            updateSeries,
            dirtyEchartsConfig?.series,
            referenceLines,
            setReferenceLines,
        ],
    );

    return (
        <Stack spacing="xs">
            <Text fw={600}>Reference lines</Text>
            {referenceLines &&
                referenceLines.map((line, index) => {
                    return (
                        <ReferenceLine
                            key={line.data.value}
                            index={index + 1}
                            isDefaultOpen={referenceLines.length <= 1}
                            items={items}
                            startOfWeek={startOfWeek}
                            referenceLine={line}
                            updateReferenceLine={updateReferenceLine}
                            removeReferenceLine={removeReferenceLine}
                        />
                    );
                })}
            <Button
                sx={{
                    alignSelf: 'start',
                }}
                variant="subtle"
                compact
                leftIcon={<MantineIcon icon={IconPlus} />}
                onClick={addReferenceLine}
            >
                Add
            </Button>
        </Stack>
    );
};
