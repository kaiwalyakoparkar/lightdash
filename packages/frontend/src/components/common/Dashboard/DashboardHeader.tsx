import { Classes, Divider } from '@blueprintjs/core';
import { subject } from '@casl/ability';
import { Dashboard, SpaceSummary, UpdatedByUser } from '@lightdash/common';
import {
    ActionIcon,
    Box,
    Button,
    Flex,
    Menu,
    Popover,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    IconCheck,
    IconChevronRight,
    IconCopy,
    IconDots,
    IconFolder,
    IconFolders,
    IconInfoCircle,
    IconPencil,
    IconPlus,
    IconRefresh,
    IconSend,
    IconTrash,
    IconUpload,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useToggle } from 'react-use';
import { DashboardSchedulersModal } from '../../../features/scheduler';
import { getSchedulerUuidFromUrlParams } from '../../../features/scheduler/utils';
import { useDashboardRefresh } from '../../../hooks/dashboard/useDashboardRefresh';
import { useApp } from '../../../providers/AppProvider';
import { useTracking } from '../../../providers/TrackingProvider';
import { EventName } from '../../../types/Events';
import AddTileButton from '../../DashboardTiles/AddTileButton';
import ShareLinkButton from '../../ShareLinkButton';
import MantineIcon from '../MantineIcon';
import DashboardUpdateModal from '../modal/DashboardUpdateModal';
import PageHeader from '../Page/PageHeader';
import {
    PageActionsContainer,
    PageTitle,
    PageTitleAndDetailsContainer,
    PageTitleContainer,
} from '../PageHeader';
import SpaceAndDashboardInfo from '../PageHeader/SpaceAndDashboardInfo';
import { UpdatedInfo } from '../PageHeader/UpdatedInfo';
import ViewInfo from '../PageHeader/ViewInfo';
import SpaceActionModal, { ActionType } from '../SpaceActionModal';

type DashboardHeaderProps = {
    spaces?: SpaceSummary[];
    dashboardDescription?: string;
    dashboardName: string;
    dashboardSpaceName?: string;
    dashboardSpaceUuid?: string;
    dashboardUpdatedAt: Date;
    dashboardViews: number;
    dashboardFirstViewedAt: Date | string | null;
    dashboardUpdatedByUser?: UpdatedByUser;
    organizationUuid?: string;
    hasDashboardChanged: boolean;
    isEditMode: boolean;
    isSaving: boolean;
    onAddTiles: (tiles: Dashboard['tiles'][number][]) => void;
    onCancel: () => void;
    onSaveDashboard: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveToSpace: (spaceUuid: string) => void;
    onExport: () => void;
};

const DashboardHeader = ({
    spaces = [],
    dashboardDescription,
    dashboardName,
    dashboardSpaceName,
    dashboardSpaceUuid,
    dashboardViews,
    dashboardFirstViewedAt,
    dashboardUpdatedAt,
    dashboardUpdatedByUser,
    organizationUuid,
    hasDashboardChanged,
    isEditMode,
    isSaving,
    onAddTiles,
    onCancel,
    onSaveDashboard,
    onDelete,
    onDuplicate,
    onMoveToSpace,
    onExport,
}: DashboardHeaderProps) => {
    const { search } = useLocation();
    const { projectUuid, dashboardUuid } = useParams<{
        projectUuid: string;
        dashboardUuid: string;
        organizationUuid: string;
    }>();
    const { isFetching, invalidateDashboardRelatedQueries } =
        useDashboardRefresh();
    const history = useHistory();
    const { track } = useTracking();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCreatingNewSpace, setIsCreatingNewSpace] = useState(false);
    const [isScheduledDeliveriesModalOpen, toggleScheduledDeliveriesModal] =
        useToggle(false);
    const handleEditClick = () => {
        setIsUpdating(true);
        track({ name: EventName.UPDATE_DASHBOARD_NAME_CLICKED });
    };

    useEffect(() => {
        const schedulerUuidFromUrlParams =
            getSchedulerUuidFromUrlParams(search);
        if (schedulerUuidFromUrlParams) {
            toggleScheduledDeliveriesModal(true);
        }
    }, [search, toggleScheduledDeliveriesModal]);

    const { user } = useApp();
    const userCanManageDashboard = user.data?.ability.can(
        'manage',
        'Dashboard',
    );

    const userCanExportData = user.data?.ability.can(
        'manage',
        subject('ExportCsv', { organizationUuid, projectUuid }),
    );

    const isOneAtLeastFetching = isFetching > 0;

    return (
        <PageHeader h="auto">
            <PageTitleAndDetailsContainer>
                <PageTitleContainer className={Classes.TEXT_OVERFLOW_ELLIPSIS}>
                    <PageTitle>{dashboardName}</PageTitle>

                    <Popover
                        withinPortal
                        withArrow
                        offset={{
                            mainAxis: -2,
                            crossAxis: 6,
                        }}
                    >
                        <Popover.Target>
                            <ActionIcon color="dark">
                                <MantineIcon icon={IconInfoCircle} />
                            </ActionIcon>
                        </Popover.Target>

                        <Popover.Dropdown>
                            <Stack spacing="xs">
                                {dashboardDescription && (
                                    <Text fz="xs" color="gray.7" fw={500}>
                                        {dashboardDescription}
                                    </Text>
                                )}

                                <UpdatedInfo
                                    updatedAt={dashboardUpdatedAt}
                                    user={dashboardUpdatedByUser}
                                />

                                <ViewInfo
                                    views={dashboardViews}
                                    firstViewedAt={dashboardFirstViewedAt}
                                />

                                {dashboardSpaceName && (
                                    <SpaceAndDashboardInfo
                                        space={{
                                            link: `/projects/${projectUuid}/spaces/${dashboardSpaceUuid}`,
                                            name: dashboardSpaceName,
                                        }}
                                    />
                                )}
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>

                    {isEditMode && userCanManageDashboard && (
                        <ActionIcon
                            color="dark"
                            disabled={isSaving}
                            onClick={handleEditClick}
                        >
                            <MantineIcon icon={IconPencil} />
                        </ActionIcon>
                    )}

                    {isUpdating && (
                        <DashboardUpdateModal
                            uuid={dashboardUuid}
                            isOpen={isUpdating}
                            onClose={() => setIsUpdating(false)}
                            onConfirm={() => setIsUpdating(false)}
                        />
                    )}
                </PageTitleContainer>
            </PageTitleAndDetailsContainer>
            {userCanManageDashboard && isEditMode ? (
                <PageActionsContainer>
                    <AddTileButton
                        onAddTiles={onAddTiles}
                        disabled={isSaving}
                    />
                    <Tooltip
                        fz="xs"
                        withinPortal
                        position="bottom"
                        label="No changes to save"
                        disabled={hasDashboardChanged}
                    >
                        <Box>
                            <Button
                                size="xs"
                                disabled={!hasDashboardChanged}
                                loading={isSaving}
                                onClick={onSaveDashboard}
                            >
                                Save
                            </Button>
                        </Box>
                    </Tooltip>
                    <Button
                        variant="default"
                        size="xs"
                        disabled={isSaving}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </PageActionsContainer>
            ) : (
                <PageActionsContainer>
                    {userCanExportData && (
                        <Button
                            size="xs"
                            loading={isOneAtLeastFetching}
                            leftIcon={<MantineIcon icon={IconRefresh} />}
                            onClick={invalidateDashboardRelatedQueries}
                        >
                            Refresh
                        </Button>
                    )}

                    {!!userCanManageDashboard && (
                        <Tooltip
                            label="Edit dashboard"
                            withinPortal
                            position="bottom"
                        >
                            <ActionIcon
                                variant="default"
                                onClick={() => {
                                    history.replace(
                                        `/projects/${projectUuid}/dashboards/${dashboardUuid}/edit`,
                                    );
                                }}
                            >
                                <MantineIcon icon={IconPencil} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {userCanExportData && (
                        <ShareLinkButton url={`${window.location.href}`} />
                    )}
                    <Menu
                        position="bottom"
                        withArrow
                        withinPortal
                        shadow="md"
                        closeOnItemClick={false}
                        disabled={!userCanManageDashboard && !userCanExportData}
                    >
                        <Menu.Target>
                            <ActionIcon variant="default">
                                <MantineIcon icon={IconDots} />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {!!userCanManageDashboard && (
                                <>
                                    <Menu.Item
                                        icon={<MantineIcon icon={IconCopy} />}
                                        onClick={onDuplicate}
                                    >
                                        Duplicate
                                    </Menu.Item>

                                    <Menu.Item
                                        icon={
                                            <MantineIcon icon={IconFolders} />
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <Menu
                                            width={250}
                                            withArrow
                                            position="left-start"
                                            shadow="md"
                                            offset={40}
                                            trigger="hover"
                                        >
                                            <Menu.Target>
                                                <Flex
                                                    justify="space-between"
                                                    align="center"
                                                >
                                                    Move to space
                                                    <MantineIcon
                                                        icon={IconChevronRight}
                                                    />
                                                </Flex>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                {spaces?.map((spaceToMove) => {
                                                    const isDisabled =
                                                        dashboardSpaceUuid ===
                                                        spaceToMove.uuid;

                                                    return (
                                                        <Menu.Item
                                                            icon={
                                                                <MantineIcon
                                                                    icon={
                                                                        isDisabled
                                                                            ? IconCheck
                                                                            : IconFolder
                                                                    }
                                                                />
                                                            }
                                                            color={
                                                                isDisabled
                                                                    ? 'gray.5'
                                                                    : ''
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (
                                                                    dashboardSpaceUuid !==
                                                                    spaceToMove.uuid
                                                                ) {
                                                                    onMoveToSpace(
                                                                        spaceToMove.uuid,
                                                                    );
                                                                }
                                                            }}
                                                            key={
                                                                spaceToMove.uuid
                                                            }
                                                        >
                                                            {spaceToMove.name}
                                                        </Menu.Item>
                                                    );
                                                })}

                                                <Divider />

                                                <Menu.Item
                                                    icon={
                                                        <MantineIcon
                                                            icon={IconPlus}
                                                        />
                                                    }
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsCreatingNewSpace(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Create new space
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Menu.Item>
                                </>
                            )}

                            {!!userCanManageDashboard && (
                                <Menu.Item
                                    icon={<MantineIcon icon={IconSend} />}
                                    onClick={() => {
                                        toggleScheduledDeliveriesModal(true);
                                    }}
                                >
                                    Scheduled deliveries
                                </Menu.Item>
                            )}

                            {(userCanExportData || userCanManageDashboard) && (
                                <Menu.Item
                                    icon={<MantineIcon icon={IconUpload} />}
                                    onClick={onExport}
                                >
                                    Export dashboard{' '}
                                </Menu.Item>
                            )}

                            {userCanManageDashboard && (
                                <>
                                    <Divider />
                                    <Menu.Item
                                        icon={
                                            <MantineIcon
                                                icon={IconTrash}
                                                color="red"
                                            />
                                        }
                                        onClick={onDelete}
                                        color="red"
                                    >
                                        Delete
                                    </Menu.Item>{' '}
                                </>
                            )}
                        </Menu.Dropdown>
                    </Menu>

                    {isCreatingNewSpace && (
                        <SpaceActionModal
                            projectUuid={projectUuid}
                            actionType={ActionType.CREATE}
                            title="Create new space"
                            confirmButtonLabel="Create"
                            icon="folder-close"
                            onClose={() => setIsCreatingNewSpace(false)}
                            onSubmitForm={(space) => {
                                if (space) onMoveToSpace(space.uuid);
                            }}
                        />
                    )}
                    {isScheduledDeliveriesModalOpen && dashboardUuid && (
                        <DashboardSchedulersModal
                            dashboardUuid={dashboardUuid}
                            name={dashboardName}
                            isOpen={isScheduledDeliveriesModalOpen}
                            onClose={() =>
                                toggleScheduledDeliveriesModal(false)
                            }
                        />
                    )}
                </PageActionsContainer>
            )}
        </PageHeader>
    );
};

export default DashboardHeader;
