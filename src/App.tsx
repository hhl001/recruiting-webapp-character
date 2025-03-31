import { useState, useEffect } from "react";
import "./App.css";
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST } from "./consts";
import type { Attributes, Class } from "./types";

interface Character {
  attributes: Attributes;
}

const MAX_ATTRIBUTE_TOTAL = 70;
const calculateModifier = (value: number): number =>
  Math.floor((value - 10) / 2);

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(
    null
  );

  const [skillCheckResults, setSkillCheckResults] = useState<{
    skill: string;
    roll: number;
    dc: number;
    result: string;
  } | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch(
          "https://recruiting.verylongdomaintotestwith.ca/api/{hhl001}/character"
        );
        const data = await response.json();

        console.log("Fetched Data:", data);

        setCharacters(Array.isArray(data.body) ? data.body : []);
      } catch (error) {
        console.error("Error fetching characters:", error);
        setCharacters([]); // Ensure an empty array is set in case of error
      }
    };

    fetchCharacters();
  }, []);

  const addNewCharacter = () => {
    setCharacters((prevChars) => {
      return [
        ...prevChars,
        {
          attributes: ATTRIBUTE_LIST.reduce(
            (acc, attr) => ({ ...acc, [attr]: 10 }),
            {} as Attributes
          ),
        },
      ];
    });
  };

  const updateAttribute = (
    charIndex: number,
    attr: keyof Attributes,
    delta: number
  ) => {
    setCharacters((prevChars) => {
      const updatedChars = [...prevChars];
      const totalAttributes = Object.values(
        updatedChars[charIndex].attributes
      ).reduce((a, b) => a + b, 0);
      if (totalAttributes + delta > MAX_ATTRIBUTE_TOTAL) return prevChars;
      updatedChars[charIndex].attributes[attr] = Math.max(
        0,
        updatedChars[charIndex].attributes[attr] + delta
      );
      return updatedChars;
    });
  };

  const checkClassEligibility = (
    charClass: Class,
    attributes: Attributes
  ): boolean => {
    return Object.keys(CLASS_LIST[charClass]).every(
      (attr) =>
        attributes[attr as keyof Attributes] >=
        CLASS_LIST[charClass][attr as keyof Attributes]
    );
  };

  const rollSkillCheck = (index: number, skill: string, dc: number) => {
    setSelectedCharacter(index);
    const roll = Math.floor(Math.random() * 20) + 1;
    const skillInfo = SKILL_LIST.find((s) => s.name === skill);
    if (!skillInfo) return;
    const skillModifier = calculateModifier(
      characters[index].attributes[
        skillInfo.attributeModifier as keyof Attributes
      ]
    );
    const total = roll + skillModifier;
    const result = total >= dc ? "Success" : "Failure";

    setSkillCheckResults({
      skill,
      roll,
      dc,
      result,
    });
  };

  const saveCharacters = async () => {
    try {
      const response = await fetch(
        "https://recruiting.verylongdomaintotestwith.ca/api/{hhl001}/character",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(characters),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save characters");
      }

      console.log("Characters saved successfully");
    } catch (error) {
      console.error("Error saving characters:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Character Sheet</h1>
      </header>
      <section className="App-section">
        <button onClick={addNewCharacter}>Add New Character</button>
        {characters.length > 0 &&
          characters.map((char, index) => (
            <div key={index}>
              <h2>Character {index + 1}</h2>
              {ATTRIBUTE_LIST.map((attr) => (
                <div key={attr}>
                  {attr}: {char.attributes[attr as keyof Attributes]} (Modifier:{" "}
                  {calculateModifier(char.attributes[attr as keyof Attributes])}
                  )
                  <button
                    onClick={() =>
                      updateAttribute(index, attr as keyof Attributes, 1)
                    }
                  >
                    +
                  </button>
                  <button
                    onClick={() =>
                      updateAttribute(index, attr as keyof Attributes, -1)
                    }
                  >
                    -
                  </button>
                </div>
              ))}

              <h3>Classes</h3>
              {Object.keys(CLASS_LIST).map((charClass) => (
                <div
                  key={charClass}
                  style={{
                    color: checkClassEligibility(
                      charClass as Class,
                      char.attributes
                    )
                      ? "green"
                      : "red",
                  }}
                >
                  {charClass}
                </div>
              ))}

              {
                <div>
                  <h3>Skill Check</h3>
                  <select id={`skill-${index}`}>
                    {SKILL_LIST.map((skill) => (
                      <option key={skill.name} value={skill.name}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                  <input type="number" id={`dc-${index}`} placeholder="DC" />
                  <button
                    onClick={() =>
                      rollSkillCheck(
                        index,
                        (
                          document.getElementById(
                            `skill-${index}`
                          ) as HTMLSelectElement
                        ).value,
                        Number(
                          (
                            document.getElementById(
                              `dc-${index}`
                            ) as HTMLInputElement
                          ).value
                        )
                      )
                    }
                  >
                    Roll
                  </button>
                  {selectedCharacter === index && skillCheckResults && (
                    <div>
                      <p>Skill: {skillCheckResults.skill}</p>
                      <p>Rolled: {skillCheckResults.roll}</p>
                      <p>DC: {skillCheckResults.dc}</p>
                      <p>Result: {skillCheckResults.result}</p>
                    </div>
                  )}
                </div>
              }
            </div>
          ))}
      </section>
      <button onClick={saveCharacters}>Save Characters</button>
    </div>
  );
}

export default App;
