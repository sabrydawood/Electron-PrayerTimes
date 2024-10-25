const fs = require("fs");
const path = require("path");
const Config = require("./Config");

class JsonDb {
  #dataFile;
  constructor(Name, UniqeKey = "Id") {
    this.UniqeKey = UniqeKey;
    this.#dataFile = path.join(__dirname, "..", "JsonDb", `${Name}.json`);
    if (!fs.existsSync(path.join(__dirname, "..", "JsonDb"))) {
      fs.mkdirSync(path.join(__dirname, "..", "JsonDb"));
    }
    if (!fs.existsSync(this.#dataFile)) {
      fs.writeFileSync(this.#dataFile, "[]");
    }
  }
  #ReadData() {
    if (!fs.existsSync(this.#dataFile)) {
      fs.writeFileSync(this.#dataFile, "[]");
    }
    let jsonString = fs.readFileSync(this.#dataFile, "utf8");
    const data = jsonString == "" ? [] : JSON.parse(jsonString);
    this.#RestoreCircularReferences(data);
    return data;
  }
  #WriteData(data) {
    const cache = new Map();
    const jsonString = JSON.stringify(
      data,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (cache.has(value)) {
            return "[Circular]"; // Mark circular references
          }
          cache.set(value, true);
        }
        return value;
      },
      2
    );
    cache.clear(); // Clear the cache after use
    fs.writeFileSync(this.#dataFile, jsonString, "utf8");
  }
  #RestoreCircularReferences(data) {
    function restore(data) {
      if (typeof data === "object" && data !== null) {
        for (const key in data) {
          if (data[key] === "[Circular]") {
            data[key] = data; // Restore the circular reference
          } else if (typeof data[key] === "object") {
            restore(data[key]); // Recursively restore nested objects
          }
        }
      }
    }
    restore(data);
  }
  GetAll() {
    return this.#ReadData();
  }
  Get(id = Config.AppID) {
    const data = this.#ReadData();
    const isExits = data.find((item) => item[this.UniqeKey] == id);
    return isExits ? isExits : null;
  }
  Create(item) {
    const data = this.#ReadData();
    const isExist = data.find(
      (oldItem) => oldItem[this.UniqeKey] == item[this.UniqeKey]
    );
    if (isExist) {
      const UpdatedData = data.map((oldItem) =>
        oldItem[this.UniqeKey] == item[this.UniqeKey] ? item : oldItem
      );
      this.#WriteData(UpdatedData);
      return item;
    }
    data.push(item);
    this.#WriteData(data);
    return item;
  }
  Update(newItem, id = Config.AppID) {
    let data = this.#ReadData();
    data = data.map((item) =>
      item[this.UniqeKey] == id ? { ...item, ...newItem } : item
    );
    this.#WriteData(data);
    return this.Get(id);
  }
  Delete(id = Config.AppID) {
    let data = this.#ReadData();
    data = data.filter((item) => item[this.UniqeKey] !== id);
    this.#WriteData(data);
    return true;
  }
}
module.exports = JsonDb;
