import React, { useState, useEffect, useLayoutEffect } from "react";

import { ThemeProvider } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { SnackbarProvider } from "notistack";
import {
	Navigate,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router-dom";

import { relaunch } from "@tauri-apps/api/process";
import {
	type UpdateManifest,
	checkUpdate,
	installUpdate,
} from "@tauri-apps/api/updater";

// Theming
import CssBaseline from "@mui/material/CssBaseline";
import "./styles/global.scss";
import { theme } from "./theme";

import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";

// MUI
import {
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	LinearProgress,
	SvgIcon,
} from "@mui/material";

// Routes
import About from "./routes/about";
import MusicAlbumTitlePage from "./routes/album/index.jsx";
import ArtistTitlePage from "./routes/artist/index.jsx";
import BoxSetTitlePage from "./routes/boxset/index.jsx";
import EpisodeTitlePage from "./routes/episode/index";
import FavoritePage from "./routes/favorite/index.jsx";
import Home from "./routes/home";
import ItemDetail from "./routes/item";
import LibraryView from "./routes/library";
import {
	LoginRoute,
	LoginWithImage,
	UserLogin,
	UserLoginManual,
} from "./routes/login";
import PersonTitlePage from "./routes/person/index.jsx";
import VideoPlayer from "./routes/player/videoPlayer";
import PlaylistTitlePage from "./routes/playlist/index.jsx";
import SearchPage from "./routes/search";
import SeriesTitlePage from "./routes/series/index.jsx";
import { ServerSetup } from "./routes/setup/server";
import ServerList from "./routes/setup/serverList/index.jsx";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Fonts
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/noto-sans/100-italic.css";
import "@fontsource/noto-sans/100.css";
import "@fontsource/noto-sans/200-italic.css";
import "@fontsource/noto-sans/200.css";
import "@fontsource/noto-sans/300-italic.css";
import "@fontsource/noto-sans/300.css";
import "@fontsource/noto-sans/400-italic.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500-italic.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/600-italic.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700-italic.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans/800-italic.css";
import "@fontsource/noto-sans/800.css";
import "@fontsource/noto-sans/900-italic.css";
import "@fontsource/noto-sans/900.css";

import "material-symbols/rounded.scss";

// Components
import { AppBar } from "./components/appBar/appBar.jsx";
import { ErrorNotice } from "./components/notices/errorNotice/errorNotice.jsx";
import AudioPlayer from "./components/playback/audioPlayer/index.jsx";

// Utils
import { useAudioPlayback } from "./utils/store/audioPlayback.js";
import { useBackdropStore } from "./utils/store/backdrop.js";
import { setInitialRoute, useCentralStore } from "./utils/store/central.js";
import { usePlaybackDataLoadStore } from "./utils/store/playback";

// 3rd Party
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { CircularProgress } from "@mui/material";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useSnackbar } from "notistack";
import { ErrorBoundary } from "react-error-boundary";

import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import {
	useIsFetching,
	useIsMutating,
	useQueryClient,
} from "@tanstack/react-query";
import NProgress from "./components/nProgress";
import Settings from "./components/settings";
import { EasterEgg } from "./components/utils/easterEgg.jsx";
import { handleRelaunch } from "./utils/misc/relaunch";
import {
	delServer,
	getAllServers,
	getDefaultServer,
	getServer,
	setDefaultServer,
} from "./utils/storage/servers";
import { type UserStore, delUser, getUser } from "./utils/storage/user";
import { axiosClient, createApi, useApi } from "./utils/store/api";

const handleAuthError = async () => {
	await delUser();
	setInitialRoute("/login/index");
};

const authenticateUser = async (address: string, user: UserStore["user"]) => {
	try {
		createApi(address, user.AccessToken);
		setInitialRoute("/home");
	} catch (error) {
		console.error(error);
		setInitialRoute("/error");
	}
};

const init = async () => {
	if (window.location.pathname !== "/") {
		window.location.href = "/";
		return;
	}

	const defaultServerOnDisk = await getDefaultServer();

	if (defaultServerOnDisk) {
		const defaultServerInfo = await getServer(defaultServerOnDisk);
		if (!defaultServerInfo) {
			await setDefaultServer(null);
			await delServer(defaultServerOnDisk);

			const servers = await getAllServers();

			setInitialRoute(servers.length > 0 ? "/servers/list" : "/setup/server");

			return;
		}

		const userOnDisk = await getUser();
		createApi(defaultServerInfo.address, "");
		try {
			const api = useApi.getState();
			const ping = await getSystemApi(api.api).getPingSystem();
			// const ping = await fetch("http://192.168.29.60:8096/System/Ping");
		} catch (error) {
			console.error(error);
			setInitialRoute("/error");
			return;
		}

		if (userOnDisk) {
			try {
				let authApi = useApi.getState().api;

				if (!authApi) {
					handleAuthError();
					return;
				}

				await authenticateUser(defaultServerInfo.address, userOnDisk);

				authApi = useApi.getState().api!;

				const user = await getUserApi(authApi).getCurrentUser();

				if (!user) {
					await delUser();
					handleAuthError();
				}
			} catch (error) {
				console.error(error);
				handleAuthError();
			}
		} else {
			setInitialRoute("/login/index");
		}
	} else {
		setInitialRoute("/setup/server");
	}
};

function App() {
	const [appReady, setAppReady] = useState(false);

	useEffect(() => {
		init().then(() => {
			setAppReady(true);
		});
	}, []);

	if (!appReady) {
		return (
			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<CircularProgress size={72} thickness={1.4} />
			</div>
		);
	}

	return <AppReady />;
}
function AppReady() {
	const [audioPlayerVisible] = useAudioPlayback((state) => [state.display]);
	const { enqueueSnackbar } = useSnackbar();

	const [initialRoute] = useCentralStore((state) => [state.initialRoute]);
	const [backdropUrl, backdropId] = useBackdropStore((state) => [
		state.backdropUrl,
		state.backdropId,
	]);
	const [playbackDataLoading] = usePlaybackDataLoadStore((state) => [
		state.isPending,
	]);

	const location = useLocation();
	const navigate = useNavigate();

	const [updateDialog, setUpdateDialog] = useState(false);
	const [updateDialogButton, setUpdateDialogButton] = useState(false);
	const [backdropLoading, setBackdropLoading] = useState(true);
	const [updateInfo, setUpdateInfo] = useState<UpdateManifest | undefined>(
		undefined,
	);

	const isQueryFetching = useIsFetching();
	const isMutating = useIsMutating();

	useEffect(() => window.scrollTo(0, 0), [location.key]);

	useLayoutEffect(() => {
		async function checkForUpdates() {
			try {
				const { shouldUpdate, manifest } = await checkUpdate();

				if (shouldUpdate) {
					setUpdateInfo(manifest);
					setUpdateDialog(true);

					console.log(`Update found : ${manifest?.version}, ${manifest?.date}`);
				}
			} catch (error) {
				console.error(error);
			}
		}
		checkForUpdates();
	}, []);

	if (!initialRoute) {
		return (
			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<CircularProgress size={72} thickness={1.4} />
			</div>
		);
	}

	return (
		<SnackbarProvider maxSnack={5}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<NProgress isAnimating={isQueryFetching || isMutating} />
				<Dialog
					open={updateDialog}
					fullWidth
					PaperProps={{
						style: {
							borderRadius: "14px",
							background: "rgb(0 0 0 / 0.5)",
							backdropFilter: "blur(10px)",
							border: "1px solid rgb(255 255 255 / 0.2)",
						},
					}}
					sx={{
						"& img": {
							width: "100%",
						},
					}}
				>
					{updateInfo !== undefined && (
						<>
							<DialogTitle
								variant="h5"
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "flex-start",
									gap: "0.4em",
								}}
							>
								Update Available!
								<Chip
									icon={
										<span className="material-symbols-rounded">update</span>
									}
									label={`v${updateInfo.version}`}
									color="success"
								/>
							</DialogTitle>
							<DialogContent dividers>
								<DialogContentText>
									<Markdown remarkPlugins={[remarkGfm]}>
										{updateInfo.body}
									</Markdown>
								</DialogContentText>
							</DialogContent>
							<DialogActions
								style={{
									padding: "1em",
								}}
							>
								<IconButton
									disabled={updateDialogButton}
									target="_blank"
									href={`https://github.com/prayag17/JellyPlayer/releases/${updateInfo.version}`}
								>
									<SvgIcon>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											fill="currentColor"
											viewBox="0 0 16 16"
										>
											<title>Update</title>
											<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8" />
										</svg>
									</SvgIcon>
								</IconButton>
								<Button
									size="large"
									color="error"
									variant="outlined"
									disabled={updateDialogButton}
									onClick={() => setUpdateDialog(false)}
								>
									close
								</Button>
								<LoadingButton
									size="large"
									color="success"
									variant="contained"
									loading={updateDialogButton}
									loadingIndicator="Updating..."
									onClick={async () => {
										setUpdateDialogButton(true);
										await installUpdate();
										enqueueSnackbar(
											"Update has been installed! You need to relaunch JellyPlayer.",
											{
												variant: "success",
											},
										);
										await relaunch();
									}}
								>
									Update
								</LoadingButton>
							</DialogActions>
						</>
					)}
				</Dialog>

				<Settings />
				<EasterEgg />

				{/* Show Dialog if server not reachable */}

				<div className="app-backdrop-container">
					<AnimatePresence>
						<motion.img
							key={backdropId}
							src={backdropUrl}
							alt=""
							className="app-backdrop"
							initial={{
								opacity: 0,
							}}
							animate={{
								opacity: backdropLoading ? 0 : 1,
							}}
							exit={{
								opacity: 0,
							}}
							transition={{
								duration: 0.8,
								ease: "easeInOut",
							}}
							onLoadCapture={() => {
								setBackdropLoading(true);
							}}
							onLoad={() => {
								setBackdropLoading(false);
							}}
							loading="eager"
							style={{
								transition: "opacity 0.8s",
							}}
						/>
					</AnimatePresence>
				</div>
				<div
					className={audioPlayerVisible ? "audio-playing" : ""}
					style={{
						display: "flex",
						width: "100vw",
						transition: "padding 250ms",
					}}
				>
					<AppBar />
					{audioPlayerVisible && <AudioPlayer />}
					<ErrorBoundary FallbackComponent={ErrorNotice} key={location.key}>
						<Routes location={location}>
								<Route path="/" element={<Navigate to={initialRoute} />} />
								<Route
									path="/error"
									element={
										<Dialog
											open
											onClose={handleRelaunch}
											aria-labelledby="alert-dialog-text"
											aria-describedby="alert-dialog-desc"
											maxWidth="md"
										>
											<DialogTitle id="alert-dialog-text">
												Unable to reach server
											</DialogTitle>
											<DialogContent>
												<DialogContentText id="alert-dialog-desc">
													Unable to connect to the jellyfin server.
												</DialogContentText>
											</DialogContent>
											<DialogActions>
												<Button
													color="secondary"
													variant="contained"
													onClick={() => navigate("/servers/list")}
												>
													Change Server
												</Button>
												<Button
													variant="contained"
													color="primary"
													onClick={handleRelaunch}
												>
													Restart JellyPlayer
												</Button>
											</DialogActions>
										</Dialog>
									}
								/>
								<Route path="/login/index" element={<LoginRoute />} />

								<Route path="/home" element={<Home />} />
								<Route path="/setup/server" element={<ServerSetup />} />
								<Route path="/servers/list" element={<ServerList />} />
								<Route
									path="/login/withImg/:userName/:userId/"
									element={<LoginWithImage />}
								/>
								<Route path="/login/users" element={<UserLogin />} />
								<Route path="/login/manual" element={<UserLoginManual />} />
								<Route path="/library/:id" element={<LibraryView />} />
								<Route path="/item/:id" element={<ItemDetail />} />
								<Route
									path="/musicalbum/:id"
									element={<MusicAlbumTitlePage />}
									errorElement={<div>Error</div>}
								/>
								<Route path="/artist/:id" element={<ArtistTitlePage />} />
								<Route path="/boxset/:id" element={<BoxSetTitlePage />} />
								<Route path="/episode/:id" element={<EpisodeTitlePage />} />
								<Route path="/person/:id" element={<PersonTitlePage />} />
								<Route path="/playlist/:id" element={<PlaylistTitlePage />} />
								<Route path="/series/:id" element={<SeriesTitlePage />} />
								<Route path="/search" element={<SearchPage />} />
								<Route path="/favorite" element={<FavoritePage />} />
								<Route path="/about" element={<About />} />
								<Route path="/player" element={<VideoPlayer />} />
						</Routes>
					</ErrorBoundary>
				</div>

				<ReactQueryDevtools buttonPosition="bottom-right" position="left" />
			</ThemeProvider>
		</SnackbarProvider>
	);
}

export default App;
