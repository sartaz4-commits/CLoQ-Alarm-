import { Question, QuizCategory } from "@/types";

export const QUESTIONS: Question[] = [
  // Science
  { category: "Science", question: "What colour is the sky on a clear day?", options: ["Green", "Blue", "Yellow", "Pink"], correct: 1, fact: "The sky looks blue because of how sunlight scatters — called Rayleigh scattering." },
  { category: "Science", question: "How many legs does a spider have?", options: ["6", "10", "8", "4"], correct: 2, fact: "8 legs is how you tell spiders apart from insects which have 6." },
  { category: "Science", question: "What do plants need to grow?", options: ["Darkness and rain", "Sunlight and water", "Snow and wind", "Sand and heat"], correct: 1, fact: "Plants convert sunlight into food through photosynthesis." },
  { category: "Science", question: "Which animal is the largest on Earth?", options: ["Elephant", "Giraffe", "Blue Whale", "Great White Shark"], correct: 2, fact: "A blue whale can weigh up to 200 tonnes — heavier than any known dinosaur." },
  { category: "Science", question: "What does a caterpillar turn into?", options: ["A moth or butterfly", "A beetle", "A bee", "A dragonfly"], correct: 0, fact: "The transformation inside a chrysalis is called metamorphosis." },
  { category: "Science", question: "What is the centre of our solar system?", options: ["The Moon", "Earth", "Mars", "The Sun"], correct: 3, fact: "The Sun contains 99.8% of all the mass in our solar system." },
  { category: "Science", question: "What gas do humans breathe in to survive?", options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Helium"], correct: 2, fact: "Every cell in your body needs oxygen to produce energy." },
  { category: "Science", question: "What do bees make?", options: ["Silk", "Honey", "Wax only", "Vinegar"], correct: 1, fact: "A single bee produces about 1/12th of a teaspoon of honey in its lifetime." },
  { category: "Science", question: "Which is hotter — the Sun or a candle?", options: ["A candle", "Same", "The Sun", "Depends on the day"], correct: 2, fact: "The Sun's surface is about 5,500°C. A candle flame is around 1,000°C." },
  { category: "Science", question: "How many bones are in the adult human body?", options: ["196", "206", "216", "186"], correct: 1, fact: "Babies are born with around 270 bones — many fuse together as we grow." },

  // History
  { category: "History", question: "In what year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, fact: "VE Day (Victory in Europe) was 8 May 1945." },
  { category: "History", question: "Who was the first person to walk on the Moon?", options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], correct: 2, fact: "Armstrong stepped onto the Moon on 20 July 1969." },
  { category: "History", question: "When did the Berlin Wall fall?", options: ["1987", "1988", "1990", "1989"], correct: 3, fact: "The Wall fell on 9 November 1989 after 28 years of division." },
  { category: "History", question: "Who was the first female Prime Minister of the UK?", options: ["Theresa May", "Margaret Thatcher", "Barbara Castle", "Shirley Williams"], correct: 1, fact: "Thatcher served from 1979 to 1990 — the longest serving PM of the 20th century." },
  { category: "History", question: "What year did the Titanic sink?", options: ["1910", "1911", "1912", "1913"], correct: 2, fact: "The Titanic sank on 15 April 1912 on her maiden voyage." },
  { category: "History", question: "Who painted the Sistine Chapel ceiling?", options: ["Da Vinci", "Raphael", "Donatello", "Michelangelo"], correct: 3, fact: "Michelangelo painted it lying on scaffolding over 4 years from 1508 to 1512." },
  { category: "History", question: "Which country was first to give women the right to vote?", options: ["UK", "USA", "New Zealand", "Australia"], correct: 2, fact: "New Zealand granted women the vote in 1893." },
  { category: "History", question: "Which empire was the largest in history by land area?", options: ["British", "Roman", "Mongol", "Ottoman"], correct: 2, fact: "The Mongol Empire covered 24 million square kilometres at its peak." },
  { category: "History", question: "Who was Julius Caesar assassinated by?", options: ["Mark Antony", "Roman senators", "Brutus alone", "Cleopatra"], correct: 1, fact: "A group of senators called the Liberatores stabbed Caesar 23 times on 15 March 44 BC." },
  { category: "History", question: "What year did the French Revolution begin?", options: ["1776", "1789", "1799", "1805"], correct: 1, fact: "The storming of the Bastille on 14 July 1789 is considered its symbolic start." },

  // Fun Facts (treated as Puzzles category umbrella)
  { category: "Fun Facts", question: "How many colours are in a rainbow?", options: ["5", "6", "7", "8"], correct: 2, fact: "Red, orange, yellow, green, blue, indigo, violet — though colours blend continuously." },
  { category: "Fun Facts", question: "What is the fastest land animal?", options: ["Lion", "Horse", "Cheetah", "Greyhound"], correct: 2, fact: "A cheetah can reach 70 mph in short bursts — 0 to 60 in 3 seconds." },
  { category: "Fun Facts", question: "How many sides does a square have?", options: ["3", "5", "6", "4"], correct: 3, fact: "A square is a rectangle where all four sides are equal length." },
  { category: "Fun Facts", question: "What do you call a baby dog?", options: ["Kitten", "Cub", "Pup", "Lamb"], correct: 2, fact: "A group of puppies born at the same time is called a litter." },
  { category: "Fun Facts", question: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2, fact: "Mars looks red because of iron oxide — rust — on its surface." },
  { category: "Fun Facts", question: "How many hours are in a day?", options: ["12", "48", "36", "24"], correct: 3, fact: "Earth actually takes 23 hours 56 minutes 4 seconds to rotate — we round to 24." },
  { category: "Fun Facts", question: "What sound does a duck make?", options: ["Moo", "Quack", "Oink", "Baa"], correct: 1, fact: "Contrary to myth a duck's quack does echo — it's just quieter than the original." },
  { category: "Fun Facts", question: "How many continents are there?", options: ["5", "6", "8", "7"], correct: 3, fact: "Africa, Antarctica, Asia, Australia, Europe, North America, South America." },
  { category: "Fun Facts", question: "Which fruit is known for keeping the doctor away?", options: ["Banana", "Orange", "Apple", "Grape"], correct: 2, fact: "Apples are high in fibre and vitamin C — the saying is mostly folklore though." },
  { category: "Fun Facts", question: "What is the most spoken language in the world?", options: ["English", "Spanish", "Mandarin", "Hindi"], correct: 2, fact: "Mandarin has over 1.1 billion native speakers — nearly double English." },

  // This or That (treated as Puzzles category umbrella)
  { category: "This or That", question: "Which is bigger — the Sun or the Moon?", options: ["The Moon", "Same size", "The Sun", "Depends on season"], correct: 2, fact: "The Sun is 400 times wider than the Moon but also 400 times further away." },
  { category: "This or That", question: "Which is heavier — a kilogram of feathers or a kilogram of bricks?", options: ["Bricks", "Feathers", "They weigh the same", "Impossible to say"], correct: 2, fact: "They both weigh exactly one kilogram. One of the oldest trick questions around." },
  { category: "This or That", question: "Which is taller — a giraffe or a double-decker bus?", options: ["Double-decker bus", "Same height", "Giraffe", "Depends on the giraffe"], correct: 2, fact: "A giraffe can be up to 6m tall. A double-decker bus is about 4.4m." },
  { category: "This or That", question: "Which animal lives longer — a dog or a tortoise?", options: ["Dog", "Same lifespan", "Tortoise", "Depends on breed"], correct: 2, fact: "Some tortoises live over 150 years. Dogs typically live 10 to 15 years." },
  { category: "This or That", question: "Which is closer to Earth — the Moon or Mars?", options: ["Mars", "Same distance", "The Moon", "Changes daily"], correct: 2, fact: "The Moon is 384,000 km away. Mars is at least 54 million km away." },
  { category: "This or That", question: "Which is louder — a whisper or a shout?", options: ["Whisper", "Same", "Shout", "Depends on room"], correct: 2, fact: "A shout reaches 80–90 decibels. A whisper is around 30 decibels." },
  { category: "This or That", question: "Which is longer — a minute or a second?", options: ["A second", "Equal", "A minute", "Depends"], correct: 2, fact: "One minute equals exactly 60 seconds." },
  { category: "This or That", question: "Which is faster — a bicycle or a tortoise?", options: ["Tortoise", "Bicycle", "Same", "Depends on hill"], correct: 1, fact: "A tortoise walks at 0.2 mph. A bicycle averages 10–15 mph." },
  { category: "This or That", question: "Which has more water — a lake or a puddle?", options: ["Puddle", "Same", "Lake", "Depends on rain"], correct: 2, fact: "The Caspian Sea holds about 78,200 cubic km of water." },
  { category: "This or That", question: "Which is colder — ice or boiling water?", options: ["Boiling water", "Same", "Ice", "Depends on salt"], correct: 2, fact: "Ice is 0°C. Boiling water is 100°C." },

  // Geography
  { category: "Geography", question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correct: 2, fact: "Many people guess Sydney but Canberra was purpose-built as the capital in 1913 as a compromise between Sydney and Melbourne." },
  { category: "Geography", question: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi", "Yangtze"], correct: 1, fact: "The Nile stretches about 6,650 km through 11 countries in northeastern Africa." },
  { category: "Geography", question: "Which country has the most natural lakes?", options: ["Russia", "USA", "Brazil", "Canada"], correct: 3, fact: "Canada has over 3 million lakes — more than all other countries combined." },
  { category: "Geography", question: "What is the smallest country in the world?", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correct: 2, fact: "Vatican City covers just 0.44 square kilometres inside Rome." },
  { category: "Geography", question: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, fact: "The Pacific Ocean is larger than all of Earth's land combined." },
  { category: "Geography", question: "Which country has the longest coastline?", options: ["Russia", "Norway", "Australia", "Canada"], correct: 3, fact: "Canada's coastline is about 202,080 km — longer than any other country." },
  { category: "Geography", question: "What is the highest mountain in Africa?", options: ["Mount Kenya", "Mount Kilimanjaro", "Mount Elgon", "Rwenzori"], correct: 1, fact: "Kilimanjaro in Tanzania stands at 5,895 metres and is a dormant volcano." },
  { category: "Geography", question: "Which country do the Galapagos Islands belong to?", options: ["Peru", "Colombia", "Ecuador", "Chile"], correct: 2, fact: "Darwin visited the Galapagos in 1835 and the wildlife there inspired his theory of evolution." },
  { category: "Geography", question: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Hiroshima", "Tokyo"], correct: 3, fact: "Tokyo is the most populous metropolitan area in the world with over 37 million people." },
  { category: "Geography", question: "Which desert is the largest in the world?", options: ["Sahara", "Arabian", "Gobi", "Antarctic"], correct: 3, fact: "Antarctica is a cold desert covering 14 million square kilometres — the Sahara is the largest hot desert." },

  // Animals
  { category: "Animals", question: "How many hearts does an octopus have?", options: ["1", "2", "3", "4"], correct: 2, fact: "Two hearts pump blood to the gills, while the third pumps it to the rest of the body." },
  { category: "Animals", question: "What is the only mammal capable of true flight?", options: ["Flying squirrel", "Sugar glider", "Bat", "Flying lemur"], correct: 2, fact: "Bats make up about 20 percent of all classified mammal species worldwide." },
  { category: "Animals", question: "How long is an elephant pregnant for?", options: ["9 months", "12 months", "18 months", "22 months"], correct: 3, fact: "At 22 months the elephant has the longest pregnancy of any land animal." },
  { category: "Animals", question: "What colour is a polar bear's skin?", options: ["White", "Pink", "Grey", "Black"], correct: 3, fact: "Their fur is actually transparent and hollow — it only appears white because it reflects light." },
  { category: "Animals", question: "Which animal cannot jump?", options: ["Hippo", "Rhino", "Elephant", "Giraffe"], correct: 2, fact: "Elephants are the only mammals that physically cannot jump — their weight and bone structure prevent it." },
  { category: "Animals", question: "How many eyes does a bee have?", options: ["2", "3", "4", "5"], correct: 3, fact: "Bees have 5 eyes — 2 large compound eyes and 3 small simple eyes on top of the head." },
  { category: "Animals", question: "What is a group of lions called?", options: ["Pack", "Herd", "Pride", "Colony"], correct: 2, fact: "A pride typically consists of related females, their cubs, and a small number of adult males." },
  { category: "Animals", question: "Which bird cannot fly but can swim?", options: ["Ostrich", "Emu", "Penguin", "Kiwi"], correct: 2, fact: "Penguins evolved flippers instead of wings — they are essentially flying underwater." },
  { category: "Animals", question: "What is the fastest fish in the ocean?", options: ["Tuna", "Sailfish", "Swordfish", "Mako shark"], correct: 1, fact: "The sailfish can reach speeds of up to 110 km/h making it the fastest fish in the sea." },
  { category: "Animals", question: "Which animal has the longest lifespan?", options: ["Greenland shark", "Giant tortoise", "Bowhead whale", "Ocean quahog clam"], correct: 0, fact: "Greenland sharks can live over 400 years — one was estimated to be 512 years old." },

  // Food
  { category: "Food", question: "Which country invented pizza?", options: ["USA", "France", "Italy", "Greece"], correct: 2, fact: "Pizza as we know it originated in Naples, Italy in the 18th century." },
  { category: "Food", question: "What is the main ingredient in guacamole?", options: ["Tomato", "Avocado", "Lime", "Onion"], correct: 1, fact: "Avocados are technically a fruit — specifically a large berry with a single seed." },
  { category: "Food", question: "Which country consumes the most tea per person?", options: ["China", "India", "UK", "Turkey"], correct: 3, fact: "Turkey consumes about 3.5 kg of tea per person per year — more than any other country." },
  { category: "Food", question: "What gives red wine its colour?", options: ["Added colouring", "The grape juice", "Grape skins", "Fermentation"], correct: 2, fact: "The pigment anthocyanin in grape skins dissolves into the wine during fermentation." },
  { category: "Food", question: "Which nut is used to make marzipan?", options: ["Walnut", "Hazelnut", "Cashew", "Almond"], correct: 3, fact: "Marzipan is made from ground almonds and sugar — it has been made since medieval times." },
  { category: "Food", question: "What is the most expensive spice in the world by weight?", options: ["Vanilla", "Cardamom", "Saffron", "Truffle"], correct: 2, fact: "Saffron costs up to £10,000 per kg because each flower only produces three tiny stigmas which are hand-picked." },
  { category: "Food", question: "Which fruit has its seeds on the outside?", options: ["Raspberry", "Strawberry", "Kiwi", "Fig"], correct: 1, fact: "What look like strawberry seeds are actually individual fruits called achenes — each containing a tiny seed inside." },
  { category: "Food", question: "What is the primary ingredient in hummus?", options: ["Lentils", "Chickpeas", "Broad beans", "Butter beans"], correct: 1, fact: "Hummus means chickpea in Arabic. The full name hummus bi tahini means chickpeas with sesame paste." },
  { category: "Food", question: "Which country invented chocolate?", options: ["Switzerland", "Belgium", "Mexico", "Spain"], correct: 2, fact: "The ancient Aztecs and Mayans were drinking cacao as a bitter liquid thousands of years before Europeans added sugar." },
  { category: "Food", question: "What vegetable is ketchup made from?", options: ["Carrot", "Pepper", "Tomato", "Beetroot"], correct: 2, fact: "Tomatoes are botanically a fruit but used culinarily as a vegetable — making ketchup technically a fruit sauce." },

  // Sport
  { category: "Sport", question: "How many players are in a rugby union team?", options: ["11", "13", "15", "16"], correct: 2, fact: "Rugby union has 15 players per side while rugby league has 13." },
  { category: "Sport", question: "How often are the Summer Olympics held?", options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], correct: 2, fact: "The modern Olympics were revived in Athens in 1896 and have been held every 4 years since except during World War II." },
  { category: "Sport", question: "Which country has won the most FIFA World Cups?", options: ["Germany", "Argentina", "Italy", "Brazil"], correct: 3, fact: "Brazil has won 5 World Cups — in 1958, 1962, 1970, 1994, and 2002." },
  { category: "Sport", question: "How many holes are in a standard round of golf?", options: ["9", "12", "18", "24"], correct: 2, fact: "The 18-hole standard was set by St Andrews in Scotland in 1858 and adopted worldwide." },
  { category: "Sport", question: "What sport is played at Wimbledon?", options: ["Badminton", "Squash", "Tennis", "Cricket"], correct: 2, fact: "Wimbledon is the oldest tennis tournament in the world, first held in 1877." },
  { category: "Sport", question: "In which sport would you perform a slam dunk?", options: ["Volleyball", "Basketball", "Handball", "Netball"], correct: 1, fact: "The slam dunk was banned in US college basketball from 1967 to 1976 partly due to Kareem Abdul-Jabbar's dominance." },
  { category: "Sport", question: "How many minutes is a standard football match?", options: ["80", "85", "90", "95"], correct: 2, fact: "90 minutes was standardised in the late 19th century — extra time and injury time are added on top." },
  { category: "Sport", question: "Which country invented cricket?", options: ["Australia", "India", "West Indies", "England"], correct: 3, fact: "Cricket originated in southeast England in the 16th century and was exported worldwide through the British Empire." },
  { category: "Sport", question: "How many Grand Slam tennis tournaments are there per year?", options: ["2", "3", "4", "5"], correct: 2, fact: "Australian Open, French Open, Wimbledon, and US Open — winning all four in a year is called a Grand Slam." },
  { category: "Sport", question: "What is the maximum score in a single bowling frame?", options: ["10", "20", "30", "40"], correct: 2, fact: "A strike in the 10th frame lets you bowl two more times — giving a maximum of 30 points in that frame." },

  // Pop Culture
  { category: "Pop Culture", question: "Which planet is Superman from?", options: ["Mars", "Krypton", "Vulcan", "Tatooine"], correct: 1, fact: "Superman was created by Jerry Siegel and Joe Shuster and first appeared in Action Comics in 1938." },
  { category: "Pop Culture", question: "What is the name of the toy cowboy in Toy Story?", options: ["Buzz", "Woody", "Rex", "Hamm"], correct: 1, fact: "Woody was voiced by Tom Hanks in all four Toy Story films." },
  { category: "Pop Culture", question: "Which band was Freddie Mercury the lead singer of?", options: ["The Rolling Stones", "Led Zeppelin", "Queen", "Aerosmith"], correct: 2, fact: "Queen's Bohemian Rhapsody took 3 weeks to record in 1975 and became one of the best-selling singles of all time." },
  { category: "Pop Culture", question: "What colour pill does Neo take in The Matrix?", options: ["Blue", "Green", "Red", "White"], correct: 2, fact: "The red pill represents truth and reality while the blue pill represents comfortable illusion." },
  { category: "Pop Culture", question: "Which author wrote Harry Potter?", options: ["Roald Dahl", "J.R.R. Tolkien", "C.S. Lewis", "J.K. Rowling"], correct: 3, fact: "Rowling came up with the idea for Harry Potter on a delayed train from Manchester to London in 1990." },
  { category: "Pop Culture", question: "What is the name of the pub in the TV show Peaky Blinders?", options: ["The Crown", "The Garrison", "The Anchor", "The Shelby Arms"], correct: 1, fact: "The Garrison Tavern is the headquarters of the Shelby family in Small Heath Birmingham." },
  { category: "Pop Culture", question: "In Friends, what is the name of Ross's pet monkey?", options: ["Dave", "Bubbles", "Marcel", "George"], correct: 2, fact: "Marcel was a white-headed capuchin monkey who appeared in the first season of Friends." },
  { category: "Pop Culture", question: "Which video game features a character called Master Chief?", options: ["Call of Duty", "Halo", "Destiny", "Gears of War"], correct: 1, fact: "Halo was a launch title for the original Xbox in 2001 and defined the console's early success." },
  { category: "Pop Culture", question: "What colour is the Monopoly board's most expensive property in the UK version?", options: ["Red", "Yellow", "Green", "Dark blue"], correct: 3, fact: "Mayfair and Park Lane are the dark blue properties — the most expensive on the UK board." },
  { category: "Pop Culture", question: "Which streaming service produced Stranger Things?", options: ["Amazon Prime", "Disney Plus", "Netflix", "Apple TV"], correct: 2, fact: "Stranger Things premiered on Netflix in July 2016 and became one of its most watched series ever." },

  // Science and Space
  { category: "Science", question: "How many moons does Mars have?", options: ["0", "1", "2", "4"], correct: 2, fact: "Mars has two small moons called Phobos and Deimos — both are thought to be captured asteroids." },
  { category: "Science", question: "What is the hardest natural substance on Earth?", options: ["Quartz", "Topaz", "Diamond", "Corundum"], correct: 2, fact: "Diamond scores 10 on the Mohs hardness scale — the only thing that can scratch a diamond is another diamond." },
  { category: "Science", question: "What does DNA stand for?", options: ["Deoxyribonucleic acid", "Dextrose nitrogen acid", "Deoxynitrogen alkaline", "Dynamic nucleic agent"], correct: 0, fact: "Your DNA if stretched out would reach from Earth to the Sun and back about 300 times." },
  { category: "Science", question: "How long does it take light to travel from the Sun to Earth?", options: ["2 minutes", "8 minutes", "20 minutes", "1 hour"], correct: 1, fact: "Light travels at 300,000 km per second and the Sun is about 150 million km away." },
  { category: "Science", question: "What is the chemical formula for water?", options: ["HO", "H3O", "H2O", "HO2"], correct: 2, fact: "Each water molecule has 2 hydrogen atoms and 1 oxygen atom — making it the most common molecule on Earth's surface." },
  { category: "Science", question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1, fact: "Saturn has 146 confirmed moons as of 2024 — more than any other planet in our solar system." },
  { category: "Science", question: "What is the name of the force that keeps your feet on the ground?", options: ["Magnetism", "Friction", "Gravity", "Tension"], correct: 2, fact: "Gravity is the weakest of the four fundamental forces but acts across infinite distances." },
  { category: "Science", question: "What percentage of the human body is water?", options: ["40 percent", "50 percent", "60 percent", "80 percent"], correct: 2, fact: "The brain and heart are about 73 percent water while the lungs are about 83 percent water." },
  { category: "Science", question: "What is the name of the galaxy we live in?", options: ["Andromeda", "Triangulum", "Milky Way", "Sombrero"], correct: 2, fact: "The Milky Way contains between 100 and 400 billion stars and is about 100,000 light years across." },
  { category: "Science", question: "How many teeth does an adult human have?", options: ["28", "30", "32", "34"], correct: 2, fact: "32 including wisdom teeth — many people have their wisdom teeth removed leaving 28." },
];

export function pickQuestion(allowed: QuizCategory[], recentlyShown: string[] = []): Question {
  const pool = allowed.includes("Mixed")
    ? QUESTIONS
    : QUESTIONS.filter((q) => {
        if (allowed.includes("Puzzles")) {
          if (q.category === "Fun Facts" || q.category === "This or That") return true;
        }
        return allowed.includes(q.category);
      });
  const source = pool.length > 0 ? pool : QUESTIONS;
  const recentSet = new Set(recentlyShown);
  const fresh = source.filter((q) => !recentSet.has(q.question));
  const candidates = fresh.length > 0 ? fresh : source;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
