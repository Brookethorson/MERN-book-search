const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

// Create the functions that fulfill the queries defined in `typeDefs.js`
const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("books");

        return userData;
      }

      throw new AuthenticationError("Not logged in");
    },
  },

  Mutation: {
    // Creates a single user and a jwt token for that user
    addUser: async (parent, args) => {
      try {
        // Creat User
        const user = await User.create(args);

        // To reduce friction for the user, we immediately sign a JSON Web Token and log the user in after they are created
        const token = signToken(user);

        // Return an `Auth` object -signed token and user's info
      } catch (err) {
        console.log(err);
      }
    },

    // A login mutation finds a specific user by email in the db
    login: async (parent, { email, password }) => {
      
      const user = await User.findOne({ email });

      // If there is no user with that email address, return an Authentication error stating so
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      // If there is a user found, execute the `isCorrectPassword` instance method and check if the correct password was provided
      const correctPw = await user.isCorrectPassword(password);

      // If the password is incorrect, return an Authentication error stating so
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      // If email and password are correct, sign user into the application with a JWT
      const token = signToken(user);

      return { token, user };
    },

    
    saveBook: async (parent, args, context) => {
     
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          // Pushes a book to an array of books associated with this user
          { $addToSet: { savedBooks: args.input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }

      //throw error if not logged in
      throw new AuthenticationError("You need to be logged in!");
    },

    
    removeBook: async (parent, args, context) => {
      // If context has a `user` property, that means the user executing this mutation has a valid JWT and is logged in
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },

          // Delete the book based on the book ID from the db
          { $pull: { savedBooks: { bookId: args.bookId } } },

          { new: true }
        );

        return updatedUser;
      }
      throw new AuthenticationError("Please login in!");
    },
  },
};

module.exports = resolvers;