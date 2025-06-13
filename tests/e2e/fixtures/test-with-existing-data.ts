// Temporary test data that matches what's actually in the database
// This is a workaround until the database seeding issue is fixed

export const EXISTING_TEST_USER_ID = 0;
export const EXISTING_TEST_GROUP_ID = 0;

export const EXISTING_MAP_ITEMS = {
  root: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [] },
  
  // First level children
  child1: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1] },
  child2: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [2] },
  child3: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [3] },
  child4: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [4] },
  child5: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [5] },
  child6: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [6] },
  
  // Grandchildren of child1
  grandchild1_1: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1, 1] },
  grandchild1_2: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1, 2] },
  grandchild1_3: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1, 3] },
  grandchild1_4: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1, 4] },
  grandchild1_5: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1, 5] },
  grandchild1_6: { userId: EXISTING_TEST_USER_ID, groupId: EXISTING_TEST_GROUP_ID, path: [1, 6] },
};

// Map ID 1 corresponds to userId=0, groupId=0, path=[]
export const getExistingRootMapId = () => "1";