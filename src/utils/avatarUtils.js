const profile_imgs_collections_list = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "icons",
  "identicon",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
  "shapes",
  "thumbs"
];

const profile_imgs_name_list = [
  "Felix", "Lily", "Max", "Ruby", "Charlie", "Daisy", "Oscar", "Lucy", "Leo", "Molly",
  "Milo", "Sophie", "Jasper", "Chloe", "Finn", "Zoe", "Gus", "Stella", "Sam", "Hazel",
  "Jack", "Violet", "Louis", "Penny", "Henry", "Luna", "George", "Bella", "Frankie", "Willow",
  "Noah", "Piper", "Ezra", "Sadie", "Owen", "Aurora", "Caleb", "Maya", "Eli", "Nora",
  "Wyatt", "Scarlett", "Grayson", "Layla", "Levi", "Eleanor", "Isaac", "Hannah", "Julian", "Grace",
  "Luke", "Aria", "Asher", "Mia", "Lincoln", "Zoe", "Adam", "Chloe", "Ethan", "Lily",
  "Daniel", "Sophia", "Matthew", "Ava", "Joseph", "Emily", "David", "Madison", "James", "Abigail",
  "Benjamin", "Elizabeth", "Andrew", "Charlotte", "William", "Amelia", "Oliver", "Harper", "Lucas", "Evelyn",
  "Michael", "Ella", "Alexander", "Sofia", "Jacob", "Avery", "Emma", "Liam", "Olivia", "Noah"
];

export const generateRandomAvatar = () => {
  const randomCollection = profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)];
  const randomName = profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)];
  return `https://api.dicebear.com/6.x/${randomCollection}/svg?seed=${randomName}`;
};
