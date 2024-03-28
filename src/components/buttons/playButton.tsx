import PropTypes from "prop-types";
import React from "react";

import Button, {
	type ButtonProps,
	type ButtonPropsSizeOverrides,
} from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import {
	type BaseItemDto,
	type BaseItemDtoQueryResult,
	BaseItemKind,
	ItemFields,
	SortOrder,
	type UserItemDataDto,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPlaylistsApi } from "@jellyfin/sdk/lib/utils/api/playlists-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../utils/store/api";
import { useAudioPlayback } from "../../utils/store/audioPlayback";

import useQueue, { setQueue } from "../../utils/store/queue";

import {
	playItem,
	setItem,
	usePlaybackDataLoadStore,
	usePlaybackStore,
} from "../../utils/store/playback";

import type { SxProps } from "@mui/material";
import { getRuntimeCompact } from "../../utils/date/time";

type PlayButtonProps = {
	item: BaseItemDto;
	itemId: string;
	itemUserData: UserItemDataDto;
	userId: string;
	itemType: BaseItemKind;
	currentAudioTrack: number;
	currentVideoTrack: number;
	currentSubTrack: number | "nosub";
	className: string;
	sx: SxProps;
	buttonProps: ButtonProps;
	iconOnly: boolean;
	audio: boolean;
	size: ButtonPropsSizeOverrides;
	playlistItem: BaseItemDto;
	playlistItemId: string;
	trackIndex: number;
};

const PlayButton = ({
	item,
	itemId,
	itemUserData,
	userId,
	itemType,
	currentAudioTrack,
	currentSubTrack,
	currentVideoTrack,
	className,
	sx,
	buttonProps,
	iconOnly,
	audio = false,
	size = "large",
	playlistItem,
	playlistItemId = "",
	trackIndex,
}: PlayButtonProps) => {
	const [api] = useApi((state) => [state.api]);

	const navigate = useNavigate();
	// const [
	// 	setUrl,
	// 	setPosition,
	// 	setDuration,
	// 	setItemId,
	// 	setItemName,
	// 	setAudioStreamIndex,
	// 	setVideoStreamIndex,
	// 	setSubtitleStreamIndex,
	// 	setMediaSourceId,
	// 	setUserId,
	// 	setMediaContainer,
	// 	setSeriesId,
	// 	setEpisodeIndex,
	// ] = usePlaybackStore((state) => [
	// 	state.setUrl,
	// 	state.setPosition,
	// 	state.setDuration,
	// 	state.setItemId,
	// 	state.setItemName,
	// 	state.setAudioStreamIndex,
	// 	state.setVideoStreamIndex,
	// 	state.setSubtitleStreamIndex,
	// 	state.setMediaSourceId,
	// 	state.setUserId,
	// 	state.setMediaContainer,
	// 	state.setSeriesId,
	// 	state.setEpisodeIndex,
	// ]);
	const [
		setAudioUrl,
		setAudioDisplay,
		setAudioItem,
		setAudioTracks,
		setCurrentTrack,
		setPlaylistItemId,
	] = useAudioPlayback((state) => [
		state.setUrl,
		state.setDisplay,
		state.setItem,
		state.setTracks,
		state.setCurrentTrack,
		state.setPlaylistItemId,
	]);
	const setPlaybackDataLoading = usePlaybackDataLoadStore(
		(state) => state.setisPending,
	);

	const { enqueueSnackbar } = useSnackbar();

	const itemQuery = useMutation({
		mutationKey: ["playButton", itemId, userId],
		mutationFn: async () => {
			setPlaybackDataLoading(true);
			let result: any;
			if (playlistItem) {
				result = await getPlaylistsApi(api).getPlaylistItems({
					userId: userId,
					playlistId: playlistItemId,
				});
			} else {
				switch (itemType) {
					case BaseItemKind.Series:
						result = await getTvShowsApi(api).getEpisodes({
							seriesId: itemId,
							limit: 1,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							enableUserData: true,
							userId: userId,
						});
						break;
					case BaseItemKind.Playlist:
						result = await getPlaylistsApi(api).getPlaylistItems({
							userId: userId,
							playlistId: playlistItemId,
						});
						break;
					case BaseItemKind.MusicAlbum:
						result = await getItemsApi(api).getItems({
							parentId: itemId,
							userId: userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: ["IndexNumber"],
						});
						break;
					case BaseItemKind.MusicArtist:
						result = await getItemsApi(api).getItems({
							artistIds: [itemId],
							recursive: true,
							includeItemTypes: [BaseItemKind.Audio],
							userId: userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: ["PremiereDate", "ProductionYear", "SortName"],
						});
						break;
					case BaseItemKind.BoxSet:
						result = await getItemsApi(api).getItems({
							parentId: itemId,
							userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: "IndexNumber",
						});
						break;
					default:
						result = await getItemsApi(api).getItems({
							ids: [itemId],
							userId: userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: "IndexNumber",
						});
						break;
				}
			}
			return result.data;
		},
		onSuccess: (result: BaseItemDtoQueryResult | null) => {
			if (trackIndex) {
				setPlaylistItemId(playlistItemId);
				// setCurrentTrack(trackIndex);
				// setAudioTracks(result.Items);
				setAudioUrl(
					`${api.basePath}/Audio/${result.Items[trackIndex].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${userId}&api_key=${api.accessToken}`,
				);
				setAudioItem(result.Items[trackIndex]);
				setAudioDisplay(true);

				setQueue(result.Items, trackIndex);
			} else if (audio) {
				setAudioItem(result.Items[0]);
				setAudioTracks(result.Items);
				setAudioUrl(
					`${api.basePath}/Audio/${result.Items[0].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${userId}&api_key=${api.accessToken}`,
				);
				setAudioDisplay(true);
				setQueue(result.Items, 0);
			} else {
				// Movie / Series Playback
				const queue = result.Items;

				let itemName = result.Items[0].Name;
				let episodeTitle = "";
				if (result.Items[0].SeriesId) {
					itemName = result.Items[0].SeriesName;
					episodeTitle = `S${result?.Items[0].ParentIndexNumber ?? 0}:E${
						result?.Items[0].IndexNumber ?? 0
					} ${result?.Items[0].Name}`;
				}

				let selectedSubtitleTrack: number | undefined = currentSubTrack;
				const subtitles = result?.Items[0].MediaSources[0].MediaStreams?.filter(
					(value) => value.Type === "Subtitle",
				);
				let enableSubtitles = true;
				if (currentSubTrack === "nosub") {
					enableSubtitles = false;
					selectedSubtitleTrack = "nosub";
				} else if (!currentSubTrack && subtitles?.length > 0) {
					selectedSubtitleTrack = subtitles[0].Index;
				} else {
					enableSubtitles = false;
				}

				playItem(
					itemName,
					episodeTitle,
					currentVideoTrack,
					currentAudioTrack,
					selectedSubtitleTrack,
					result.Items[0].Container,
					enableSubtitles,
					`${api.basePath}/Videos/${result.Items[0].Id}/stream.${result.Items[0].Container}?Static=true&mediaSourceId=${result.Items[0].Id}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}&Tag=${result.Items[0].MediaSources[0].ETag}&videoStreamIndex=${currentVideoTrack}&audioStreamIndex=${currentAudioTrack}`,
					userId,
					result?.Items[0].UserData?.PlaybackPositionTicks,
					result.Items[0].RunTimeTicks,
					result.Items[0],
					queue,
					0,
					subtitles,
					result?.Items[0].MediaSources[0].Id,
				);
				navigate("/player");
			}
		},
		onSettled: () => {
			setPlaybackDataLoading(false);
		},
		onError: (error) => {
			enqueueSnackbar(`${error}`, {
				variant: "error",
			});
		},
	});
	const handleClick = (e) => {
		e.stopPropagation();
		itemQuery.mutate();
	};
	if (iconOnly) {
		return (
			<Fab
				color="primary"
				aria-label="Play"
				className={className}
				onClick={handleClick}
				sx={sx}
				size={size}
				{...buttonProps}
			>
				<div
					className="material-symbols-rounded em-4 fill"
					style={{
						fontSize: "3em",
					}}
				>
					play_arrow
				</div>
			</Fab>
		);
	}
	return (
		<div
			className="play-button"
			style={{
				width: "auto",
				position: "relative",
			}}
		>
			<Button
				className={className ?? "play-button"}
				variant="contained"
				onClick={handleClick}
				startIcon={
					<div
						className="material-symbols-rounded fill"
						style={{
							zIndex: 1,
							fontSize: "2em",
						}}
					>
						play_arrow
					</div>
				}
				{...buttonProps}
				sx={{
					position: "relative",
					overflow: "hidden",
				}}
				color="white"
				size={size}
			>
				{itemUserData.PlaybackPositionTicks > 0
					? "Continue Watching"
					: item?.Type === "MusicAlbum" ||
							item?.Type === "Audio" ||
							item?.Type === "AudioBook" ||
							item?.Type === "Playlist" ||
							audio
						? "Play Now"
						: "Watch Now"}
				<LinearProgress
					variant="determinate"
					value={
						100 > itemUserData.PlayedPercentage > 0
							? itemUserData.PlayedPercentage
							: 0
					}
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						height: "100%",
						background: "transparent",
						opacity: 0.2,
						zIndex: 0,
						mixBlendMode: "difference",
					}}
					color="white"
				/>
			</Button>
			{itemUserData.PlaybackPositionTicks > 0 && (
				<Typography
					sx={{
						opacity: 0.8,
						position: "absolute",
						bottom: "-1.8em",
						left: "50%",
						transform: "translate(-50%)",
					}}
					variant="caption"
				>
					{getRuntimeCompact(
						item.RunTimeTicks - itemUserData.PlaybackPositionTicks,
					)}{" "}
					left
				</Typography>
			)}
		</div>
	);
};

export default PlayButton;

PlayButton.propTypes = {
	itemId: PropTypes.string,
	itemUserData: PropTypes.object,
	userId: PropTypes.string,
	itemType: PropTypes.string,
	currentAudioTrack: PropTypes.number,
	currentSubTrack: PropTypes.number,
	currentVideoTrack: PropTypes.number,
	className: PropTypes.string,
	sx: PropTypes.any,
	iconProps: PropTypes.any,
	buttonProps: PropTypes.any,
	iconOnly: PropTypes.bool,
};
