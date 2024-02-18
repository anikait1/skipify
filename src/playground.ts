import typia from "typia";

type Animal = {
    name: string;
    age: number;
}

const animal = {name: 'Anikait', age: 42}
const notAnimal = {age: 43}

console.log(typia.validate<Animal>(animal))
console.log(typia.validate<Animal>(notAnimal))