import { promises as fs } from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { analyzeVideo } from "../src/lib/youtube/get-transcript";
import {
  HexCoord,
  CoordSystem,
  HexDirection,
} from "../src/lib/domains/mapping/utils/hex-coordinates";
import { db } from "../src/server/db";
import { MappingService } from "../src/lib/domains/mapping/services/mapping.service";
import { DbMapItemRepository } from "../src/lib/domains/mapping/infrastructure/map-item/db";
import { DbBaseItemRepository } from "../src/lib/domains/mapping/infrastructure/base-item/db";
import { users } from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import { UserMappingService } from "../src/server/api/services/user-mapping.service";

// Load environment variables
dotenv.config();

// Create or get the OsonsComprendre user
async function createOrGetOsonsComprendreUser(): Promise<number> {
  const authUserId = "osons-comprendre-user";
  const userEmail = "osons.comprendre@example.com";
  const userName = "OsonsComprendre";

  try {
    // Check if auth user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, authUserId))
      .limit(1);

    if (existingUser.length === 0) {
      // Create the auth user
      console.log(`Creating auth user: ${userName}`);
      await db.insert(users).values({
        id: authUserId,
        email: userEmail,
        name: userName,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created auth user with ID: ${authUserId}`);
    } else {
      console.log(`Auth user ${userName} already exists`);
    }

    // Get or create mapping user ID
    const mappingUserId =
      await UserMappingService.getOrCreateMappingUserId(authUserId);
    console.log(`Using mapping user ID: ${mappingUserId}`);

    return mappingUserId;
  } catch (error) {
    console.error("Error creating/getting OsonsComprendre user:", error);
    throw error;
  }
}

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
  // Create mapping service directly, bypassing tRPC auth
  const repositories = {
    mapItem: new DbMapItemRepository(db),
    baseItem: new DbBaseItemRepository(db),
  };
  const mappingService = new MappingService(repositories);

  try {
    // Step 1: Create or get the OsonsComprendre user
    console.log("Creating or getting OsonsComprendre user...");
    const userId = await createOrGetOsonsComprendreUser();

    const groupId = 1;

    // Step 2: Clean up any existing map for this user/group
    console.log("Cleaning up any existing OsonsComprendre map...");
    try {
      await mappingService.maps.removeMap({ userId, groupId });
      console.log("Successfully removed existing map");
    } catch (error) {
      console.log("No existing map to remove or removal failed:", error);
    }

    // Step 3: Get video IDs from transcripts
    const videoIds = await getVideoIdsFromTranscripts();

    if (videoIds.length === 0) {
      console.error(
        "No transcripts found in the OsonsComprendre directory. Please make sure transcript files exist.",
      );
      return;
    }

    console.log(`Found ${videoIds.length} videos to process`);

    // Step 4: Create the main map directly using the mapping service
    console.log("Creating main 'OsonsComprendre' map...");
    const mainMap = await mappingService.maps.createMap({
      userId,
      groupId,
      title: "OsonsComprendre",
      descr: "Map of OsonsComprendre YouTube videos and their ideas",
    });

    console.log(`Created main map with ID: ${mainMap.id}`);

    // Get center coordinates for the map
    const centerCoord = CoordSystem.getCenterCoord(userId, groupId);

    // Step 5-7: Process each video and add items to the map
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
      const direction = (videoIndex % 6) as HexDirection; // 0-5 safe range
      const videoCoord = CoordSystem.getNeighborCoord(centerCoord, direction);

      // Step 5: Add video as an item to the main map (child of the root map item)
      console.log(`Adding video ${analysis.title} to map...`);
      const videoItem = await mappingService.items.crud.addItemToMap({
        parentId: mainMap.id,
        coords: videoCoord,
        title: analysis.title,
        descr: analysis.abstract,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });

      // Step 6: Add ideas as children of the video item
      if (analysis.ideas && Array.isArray(analysis.ideas)) {
        for (
          let ideaIndex = 0;
          ideaIndex < analysis.ideas.length;
          ideaIndex++
        ) {
          const idea = analysis.ideas[ideaIndex];
          console.log(`Adding idea "${idea.title}"...`);

          // Calculate coordinates for this idea (second level - child of video)
          const ideaDirection = ((ideaIndex + 1) % 6) as HexDirection;
          const ideaCoord = CoordSystem.getNeighborCoord(
            videoCoord,
            ideaDirection,
          );

          // Use the video item as parent for the idea
          const ideaItem = await mappingService.items.crud.addItemToMap({
            parentId: Number(videoItem.id),
            coords: ideaCoord,
            title: idea.title,
            descr: idea.abstract,
          });

          // Step 7: Add sequences as children of the idea
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
              const seqCoord = CoordSystem.getNeighborCoord(
                ideaCoord,
                seqDirection,
              );

              // Use the idea item as parent for the sequence
              await mappingService.items.crud.addItemToMap({
                parentId: Number(ideaItem.id),
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
