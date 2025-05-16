import { promises as fs } from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { analyzeVideo } from "../src/lib/youtube/get-transcript";
import { createCaller } from "../src/server/api/root";
import { createInnerTRPCContext } from "../src/server/api/trpc";
import {
  HexCoord,
  HexCoordSystem,
  HexDirection,
} from "../src/lib/domains/mapping/utils/hex-coordinates";

// Load environment variables
dotenv.config();

// Ensure script directory exists
(async function ensureDirectoryExists() {
  try {
    // Ensure the scripts directory exists
    const scriptsDir = path.join(process.cwd(), "scripts");
    await fs.access(scriptsDir).catch(() => fs.mkdir(scriptsDir));

    // Ensure the analysis directory exists
    const analysisDir = path.join(
      process.cwd(),
      "src",
      "lib",
      "youtube",
      "analysis",
    );
    await fs
      .access(analysisDir)
      .catch(() => fs.mkdir(analysisDir, { recursive: true }));

    // Ensure the OsonsComprendre directory exists in analysis
    const osonsComprendreDir = path.join(analysisDir, "OsonsComprendre");
    await fs
      .access(osonsComprendreDir)
      .catch(() => fs.mkdir(osonsComprendreDir, { recursive: true }));
  } catch (error) {
    console.error("Error ensuring directories exist:", error);
  }
})();

// Convert MM:SS format to seconds
function timeCodeToSeconds(timeCode: string): number {
  const parts = timeCode.split(":");
  const minutes = parts[0] ? parseInt(parts[0], 10) : 0;
  const seconds = parts[1] ? parseInt(parts[1], 10) : 0;
  return minutes * 60 + seconds;
}

async function getVideoIdsFromTranscripts(): Promise<string[]> {
  try {
    const transcriptsDir = path.join(
      process.cwd(),
      "src",
      "lib",
      "youtube",
      "transcripts",
      "OsonsComprendre",
    );

    const files = await fs.readdir(transcriptsDir);
    return files
      .filter((file) => file.endsWith(".txt"))
      .map((file) => file.replace(".txt", ""))
      .slice(0, 6); // Get only first 6 transcripts
  } catch (error) {
    console.error("Error reading transcript directory:", error);
    return [];
  }
}

async function getOrCreateAnalysis(videoId: string): Promise<any> {
  const analysisDir = path.join(
    process.cwd(),
    "src",
    "lib",
    "youtube",
    "analysis",
    "OsonsComprendre",
  );

  // Ensure the directory exists
  try {
    await fs.access(analysisDir);
  } catch {
    await fs.mkdir(analysisDir, { recursive: true });
  }

  const analysisPath = path.join(analysisDir, `${videoId}.poc.json`);

  try {
    // Check if analysis already exists
    await fs.access(analysisPath);
    console.log(`Analysis for ${videoId} already exists. Reading from file...`);
    const analysisData = await fs.readFile(analysisPath, "utf-8");
    return JSON.parse(analysisData);
  } catch {
    // Analysis doesn't exist, create it
    console.log(`Creating analysis for ${videoId}...`);
    const analysis = await analyzeVideo(videoId);

    // Save the analysis
    await fs.writeFile(
      analysisPath,
      JSON.stringify(analysis, null, 2),
      "utf-8",
    );

    return analysis;
  }
}

async function populateDb() {
  // Create TRPC context and caller (similar to buildHexMap.ts)
  const ctx = createInnerTRPCContext({ session: null });
  const caller = createCaller(ctx);

  try {
    // Step 1: Get video IDs from transcripts
    const videoIds = await getVideoIdsFromTranscripts();

    if (videoIds.length === 0) {
      console.error(
        "No transcripts found in the OsonsComprendre directory. Please make sure transcript files exist.",
      );
      return;
    }

    console.log(`Found ${videoIds.length} videos to process`);

    // Step 2: Create the main map
    console.log("Creating main 'OsonsComprendre' map...");
    const mainMap = await caller.map.create({
      name: "OsonsComprendre",
      description: "Map of OsonsComprendre YouTube videos and their ideas",
    });

    console.log(`Created main map with ID: ${mainMap.id}`);

    // Get center coordinates for the map
    const centerCoord = HexCoordSystem.getCenterCoord();

    // Step 3-5: Process each video and add items to the map
    for (let videoIndex = 0; videoIndex < videoIds.length; videoIndex++) {
      const videoId = videoIds[videoIndex];
      if (!videoId) {
        throw new Error("Video ID is undefined");
      }
      console.log(`Processing video ${videoId}...`);

      // Get or create analysis for this video
      const analysis = await getOrCreateAnalysis(videoId);

      // Calculate coordinates for this video (first level children of center)
      // We'll place them around the center using different directions
      const direction = (videoIndex + 1) as HexDirection; // 6 directions available
      const videoCoord = HexCoordSystem.getNeighborCoord(
        centerCoord,
        direction,
      );

      // Step 3: Add video as an item to the main map
      console.log(`Adding video ${analysis.title} to map...`);
      await caller.map.addItem({
        centerId: mainMap.id,
        coords: videoCoord,
        title: analysis.title,
        descr: analysis.abstract,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });

      // Step 4: Add ideas as children of the video item
      if (analysis.ideas && Array.isArray(analysis.ideas)) {
        for (
          let ideaIndex = 0;
          ideaIndex < analysis.ideas.length;
          ideaIndex++
        ) {
          const idea = analysis.ideas[ideaIndex];
          console.log(`Adding idea "${idea.title}"...`);

          // Calculate coordinates for this idea (second level - child of video)
          const ideaDirection = ((ideaIndex + 1) % 7) as HexDirection;
          const ideaCoord = HexCoordSystem.getNeighborCoord(
            videoCoord,
            ideaDirection,
          );

          await caller.map.addItem({
            centerId: mainMap.id,
            coords: ideaCoord,
            title: idea.title,
            descr: idea.abstract,
          });

          // Step 5: Add sequences as children of the idea
          if (idea.sequences && Array.isArray(idea.sequences)) {
            for (
              let seqIndex = 0;
              seqIndex < idea.sequences.length;
              seqIndex++
            ) {
              const sequence = idea.sequences[seqIndex];
              console.log(`Adding sequence "${sequence.title}"...`);

              // Calculate coordinates for this sequence (third level - child of idea)
              const seqDirection = ((seqIndex + 1) % 7) as HexDirection;
              const seqCoord = HexCoordSystem.getNeighborCoord(
                ideaCoord,
                seqDirection,
              );

              await caller.map.addItem({
                centerId: mainMap.id,
                coords: seqCoord,
                title: sequence.title,
                descr: sequence.abstract,
                url: `https://www.youtube.com/watch?v=${videoId}&t=${timeCodeToSeconds(sequence.timecode)}`,
              });
            }
          }
        }
      }

      console.log(`Completed processing for video ${videoId}`);
    }

    console.log("Database population complete!");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

// Run the script if called directly
// In ES modules, use this simple check
const isMainModule =
  process.argv[1]?.endsWith("populate-db.ts") ||
  process.argv[1]?.endsWith("populate-db.js");
if (isMainModule) {
  populateDb().catch(console.error);
}

export { populateDb };
