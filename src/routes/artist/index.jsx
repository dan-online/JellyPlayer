/** @format */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { AnimatePresence, motion } from "framer-motion";

import { useParams } from "react-router-dom";

import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";

import { useQuery } from "@tanstack/react-query";

import Hero from "../../components/layouts/item/hero";
import { Card } from "../../components/card/card";

import "./artist.module.scss";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { ArtistAlbum } from "../../components/layouts/artist/artistAlbum";
import { useBackdropStore } from "../../utils/store/backdrop";
import MusicTrack from "../../components/musicTrack";
import { useApi } from "../../utils/store/api";

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
			style={{ marginTop: "1em" }}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

const ArtistTitlePage = () => {
	const { id } = useParams();
	const [api] = useApi((state) => [state.api]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
				userId: user.data.Id,
				itemId: id,
				fields: [ItemFields.Crew],
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const artistDiscography = useQuery({
		queryKey: ["item", id, "artist", "discography"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				albumArtistIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.data.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicArtist,
		networkMode: "always",
	});

	const artistSongs = useQuery({
		queryKey: ["item", id, "artist", "songs"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				artistIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Ascending],
				recursive: true,
				includeItemTypes: [BaseItemKind.Audio],
				userId: user.data.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicArtist,
		networkMode: "always",
	});

	const artistAppearances = useQuery({
		queryKey: ["item", id, "artist", "appearences"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				contributingArtistIds: [item.data.Id],
				excludeItemIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicArtist,
		networkMode: "always",
	});

	const artistTabs = [
		{ title: "Discography", data: artistDiscography },
		{ title: "Songs", data: artistSongs },
		{ title: "Appearances", data: artistAppearances },
	];
	const [activeArtistTab, setActiveArtistTab] = useState(0);

	useEffect(() => {
		if (
			artistDiscography.isSuccess &&
			artistSongs.isSuccess &&
			artistAppearances.isSuccess
		) {
			if (artistDiscography.data.TotalRecordCount != 0) {
				setActiveArtistTab(0);
			} else if (artistSongs.data.TotalRecordCount != 0) {
				setActiveArtistTab(1);
			} else if (artistAppearances.data.TotalRecordCount != 0) {
				setActiveArtistTab(2);
			}
		}
	}, [
		artistDiscography.isPending,
		artistSongs.isPending,
		artistAppearances.isPending,
	]);

	const [animationDirection, setAnimationDirection] = useState("forward");

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	useEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				item.data.Type === BaseItemKind.MusicAlbum ||
					item.data.Type === BaseItemKind.Episode
					? `${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
				item.data.Id,
			);
		}
	}, [item.isSuccess]);

	if (item.isPending) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}
	if (item.isSuccess) {
		return (
			<motion.div
				key={id}
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: 1,
				}}
				transition={{
					duration: 0.25,
					ease: "easeInOut",
				}}
				className="scrollY"
				style={{
					padding: "5em 2em 2em 1em",
					display: "flex",
					flexDirection: "column",
					gap: "0.5em",
				}}
			>
				<Hero
					item={item.data}
					userId={user.data.Id}
					queryKey={["item", id]}
					disableMarkAsPlayedButton
					audioPlayButton
					disableInfoStrip
				/>

				<div className="item-detail-artist-container">
					<div className="item-detail-artist-header">
						<Tabs
							variant="scrollable"
							value={activeArtistTab}
							onChange={(e, newVal) => {
								if (newVal > activeArtistTab) {
									setAnimationDirection("forward");
								} else if (newVal < activeArtistTab) {
									setAnimationDirection("backwards");
								}
								setActiveArtistTab(newVal);
							}}
						>
							{artistTabs.map((tab, index) => {
								return (
									<Tab
										key={index}
										label={tab.title}
										disabled={
											tab.data.data
												?.TotalRecordCount ==
											0
										}
									/>
								);
							})}
						</Tabs>
						<Divider />
					</div>
					<AnimatePresence>
						<TabPanel value={activeArtistTab} index={0}>
							<motion.div
								key={activeArtistTab}
								initial={{
									opacity: 0,
									transform:
										animationDirection ==
										"forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{
									opacity: 1,
									transform: "translate(0px)",
								}}
								transition={{
									duration: 0.2,
									ease: "anticipate",
								}}
							>
								{artistDiscography.isSuccess &&
									artistDiscography.data.Items.map(
										(tabitem, aindex) => {
											return (
												<ArtistAlbum
													key={aindex}
													user={
														user.data
													}
													album={tabitem}
												/>
											);
										},
									)}
							</motion.div>
						</TabPanel>
						<TabPanel value={activeArtistTab} index={1}>
							<motion.div
								key={activeArtistTab}
								initial={{
									opacity: 0,
									transform:
										animationDirection ==
										"forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{
									opacity: 1,
									transform: "translate(0px)",
								}}
								transition={{
									duration: 0.2,
									ease: "anticipate",
								}}
							>
								{artistSongs.isSuccess &&
									artistSongs.data.Items.map(
										(tabitem) => {
											return (
												<MusicTrack
													item={tabitem}
													key={
														tabitem.Id
													}
													queryKey={[
														"item",
														id,
														"artist",
														"songs",
													]}
													userId={
														user.data
															.Id
													}
												/>
											);
										},
									)}
							</motion.div>
						</TabPanel>
						<TabPanel value={activeArtistTab} index={2}>
							<motion.div
								key={activeArtistTab}
								initial={{
									opacity: 0,
									transform:
										animationDirection ==
										"forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{
									opacity: 1,
									transform: "translate(0px)",
								}}
								transition={{
									duration: 0.2,
									ease: "anticipate",
								}}
								className="grid"
							>
								{artistAppearances.isSuccess &&
									artistAppearances.data.Items.map(
										(tabitem) => {
											return (
												<Card
													key={
														tabitem.Id
													}
													item={tabitem}
													cardTitle={
														tabitem.Name
													}
													imageType={
														"Primary"
													}
													cardCaption={
														tabitem.AlbumArtist
													}
													cardType={
														"square"
													}
													queryKey={[
														"item",
														id,
														"artist",
														"appearences",
													]}
													userId={
														user.data
															.Id
													}
													imageBlurhash={
														!!tabitem
															.ImageBlurHashes
															?.Primary &&
														tabitem
															.ImageBlurHashes
															?.Primary[
															Object.keys(
																tabitem
																	.ImageBlurHashes
																	.Primary,
															)[0]
														]
													}
												></Card>
											);
										},
									)}
							</motion.div>
						</TabPanel>
					</AnimatePresence>
				</div>
			</motion.div>
		);
	}
	if (item.isError) {
		return <ErrorNotice />;
	}
};

export default ArtistTitlePage;
