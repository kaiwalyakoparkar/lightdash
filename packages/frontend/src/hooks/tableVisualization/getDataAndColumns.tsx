import {
    ApiQueryResults,
    Field,
    formatItemValue,
    friendlyName,
    isField,
    ResultRow,
    TableCalculation,
} from '@lightdash/common';
import {
    TableHeaderBoldLabel,
    TableHeaderLabelContainer,
    TableHeaderRegularLabel,
} from '../../components/common/Table/Table.styles';
import {
    columnHelper,
    TableColumn,
    TableHeader,
} from '../../components/common/Table/types';
import { getResultColumnTotalsFromItemsMap } from '../useColumnTotals';

type Args = {
    itemsMap: Record<string, Field | TableCalculation>;
    selectedItemIds: string[];
    resultsData: ApiQueryResults;
    isColumnVisible: (key: string) => boolean;
    isColumnFrozen: (key: string) => boolean;
    showTableNames: boolean;
    getFieldLabelOverride: (key: string) => string | undefined;
    columnOrder: string[];
};

const getDataAndColumns = ({
    itemsMap,
    selectedItemIds,
    resultsData,
    isColumnVisible,
    isColumnFrozen,
    showTableNames,
    getFieldLabelOverride,
    columnOrder,
}: Args): {
    rows: ResultRow[];
    columns: Array<TableHeader | TableColumn>;
    error?: string;
} => {
    const totals = getResultColumnTotalsFromItemsMap(
        resultsData.rows,
        itemsMap,
    );
    const columns = selectedItemIds.reduce<Array<TableHeader | TableColumn>>(
        (acc, itemId) => {
            const item = itemsMap[itemId] as
                | typeof itemsMap[number]
                | undefined;

            if (!columnOrder.includes(itemId)) {
                return acc;
            }
            const headerOverride = getFieldLabelOverride(itemId);

            const column: TableHeader | TableColumn = columnHelper.accessor(
                (row) => row[itemId],
                {
                    id: itemId,
                    header: () => (
                        <TableHeaderLabelContainer>
                            {!!headerOverride ? (
                                <TableHeaderBoldLabel>
                                    {headerOverride}
                                </TableHeaderBoldLabel>
                            ) : isField(item) ? (
                                <>
                                    {showTableNames && (
                                        <TableHeaderRegularLabel>
                                            {item.tableLabel}{' '}
                                        </TableHeaderRegularLabel>
                                    )}

                                    <TableHeaderBoldLabel>
                                        {item.label}
                                    </TableHeaderBoldLabel>
                                </>
                            ) : (
                                <TableHeaderBoldLabel>
                                    {item === undefined
                                        ? 'Undefined'
                                        : item.displayName ||
                                          friendlyName(item.name)}
                                </TableHeaderBoldLabel>
                            )}
                        </TableHeaderLabelContainer>
                    ),
                    cell: (info: any) =>
                        info.getValue()?.value.formatted || '-',

                    footer: () =>
                        totals[itemId]
                            ? formatItemValue(item, totals[itemId])
                            : null,
                    meta: {
                        item,
                        isVisible: isColumnVisible(itemId),
                        frozen: isColumnFrozen(itemId),
                    },
                },
            );
            return [...acc, column];
        },
        [],
    );
    return {
        rows: resultsData.rows,
        columns,
    };
};

export default getDataAndColumns;
